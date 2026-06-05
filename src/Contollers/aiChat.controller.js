import model, { fileManager } from "../../utils/gemini.js";
import fs from "fs";
import AIChat from "../Models/AIChat.model.js";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";
import path from "path";
import Book from "../Models/books.model.js";
import { 
  sanitizeText, 
  sanitizeConversationContext, 
  checkHighRiskPII, 
  sanitizeAIPrompt,
  generatePIIAuditLog 
} from "../Utiles/piiSanitizer.js";
import { getSafeFileForAI } from "../Utiles/filePIIScanner.js";
import { 
  retrieveLocalContext, 
  buildRAGPrompt, 
} from "../Utiles/ragService.js";
import { logApiCall } from "../services/activityLog.service.js";

export const getChatHistory = async (req, res) => {
  const { districtId, schoolId } = req.user
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const userId = req.user._id;
    const chats = await AIChat.find({ userId }).limit(limit);

    res.json({ success: true, chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "getChatHistory" });
  }
};

export const askAIupdated = async (req, res) => {
  const { districtId, schoolId } = req.user;
  const userId = req.user._id;

  try {
    const { question, difficulty, context } = req.body;
    const file = req.file;

    // --------------------------------------------------
    // FERPA COMPLIANCE: PII Detection & Sanitization
    // --------------------------------------------------
    
    // Step 1: Check for high-risk PII in question (SSN, student ID, mother's maiden name)
    const highRiskCheck = checkHighRiskPII(question);
    if (highRiskCheck.shouldBlock) {
      // Log the blocked attempt for audit
      await logApiCall({
        method: req.method,
        route: req.originalUrl,
        userId,
        statusCode: 400,
        responseTime: 0,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: {
          event: "pii_blocked",
          detectedTypes: highRiskCheck.detectedTypes,
          reason: "High-risk PII detected in question",
        },
      });

      return res.status(400).json({
        success: false,
        error: "FERPA_COMPLIANCE",
        message: "Your question contains sensitive information that cannot be processed. Please remove personal identifiers and try again.",
        detectedTypes: highRiskCheck.detectedTypes,
      });
    }

    // Step 2: Sanitize the question text
    const { sanitizedText: sanitizedQuestion, report: questionSanitizationReport } = 
      sanitizeText(question, { redact: true });

    // Step 3: Scan uploaded file for PII (if file provided)
    let fileSafeToSend = true;
    let fileSanitizationReport = null;
    
    if (file) {
      const fileScanResult = await getSafeFileForAI(file.path, file.mimetype, userId);
      
      if (!fileScanResult.canSend) {
        // Log the blocked file upload
        await logApiCall({
          method: req.method,
          route: req.originalUrl,
          userId,
          statusCode: 400,
          responseTime: 0,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          metadata: {
            event: "file_pii_blocked",
            filename: file.originalname,
            reason: fileScanResult.reason,
          },
        });

        return res.status(400).json({
          success: false,
          error: "FERPA_COMPLIANCE",
          message: fileScanResult.reason,
          filename: file.originalname,
        });
      }
      
      fileSanitizationReport = fileScanResult.auditLog;
    }

    // Step 4: Sanitize conversation context (chat history)
    let conversationContext = "";
    let shouldUseContext = false;

    const history = await AIChat.findOne({ userId }).sort({ createdAt: -1 });

    if (context) {
      const messageContext = await AIChat.findById(context);
      if (messageContext) {
        const sanitizedContext = sanitizeConversationContext(messageContext);
        conversationContext += `Student: ${sanitizedContext.question.text || sanitizedContext.question}\n`;
        conversationContext += `Tutor: ${sanitizedContext.answer.text || sanitizedContext.answer}\n`;
        shouldUseContext = true;
      }
    }

    // --------------------------------------------------
    // FERPA COMPLIANCE: RAG with Local Knowledge Base
    // --------------------------------------------------
    
    // Retrieve relevant educational content from local knowledge base
    const localContext = await retrieveLocalContext(sanitizedQuestion, {
      districtId,
      schoolId,
    });

    // --------------------------------------------------
    // 1️⃣ Detect assessment file (AI-based) - WITH SANITIZATION
    // --------------------------------------------------
    let isAssessmentFile = false;

    if (file) {
      const buffer = fs.readFileSync(file.path);
      const base64 = buffer.toString("base64");

      const assessmentPrompt = `
Reply ONLY "yes" or "no".

Is the uploaded file a graded academic assessment
(homework, assignment, quiz, test, exam, worksheet)?

Reply "no" for notes, slides, textbooks, study material.

Question:
"${sanitizedQuestion}"
`;

      const assessmentCheck = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: assessmentPrompt },
              {
                inlineData: {
                  data: base64,
                  mimeType: file.mimetype,
                },
              },
            ],
          },
        ],
      });

      isAssessmentFile =
        assessmentCheck.response.text().trim().toLowerCase() === "yes";
    }

    // --------------------------------------------------
    // 2️⃣ Detect student intent (answer vs understanding) - WITH SANITIZATION
    // --------------------------------------------------
    let isAnswerSeeking = false;

    if (isAssessmentFile) {
      const intentPrompt = `
Reply ONLY "answer" or "understanding".

Answer = wants solution, final answer, solving.
Understanding = wants explanation, concept clarity.

Student message:
"${sanitizedQuestion}"
`;

      const intentCheck = await model.generateContent(intentPrompt);
      isAnswerSeeking =
        intentCheck.response.text().trim().toLowerCase() === "answer";
    }

    // --------------------------------------------------
    // 3️⃣ Detect file generation intent (WITH SANITIZATION)
    // --------------------------------------------------
    let requestedFileType = "none";

    if (!(isAssessmentFile && isAnswerSeeking)) {
      const fileGenerationPrompt = `
Analyze this user message.
Reply ONLY one word: "pdf", "word", "excel", or "none".

User message:
"${sanitizedQuestion}"
`;
      const fileTypeCheck = await model.generateContent(fileGenerationPrompt);
      requestedFileType = fileTypeCheck.response.text().trim().toLowerCase();
    }

    // --------------------------------------------------
    // 4️⃣ PROMPTS (WITH RAG CONTEXT)
    // --------------------------------------------------
    const blockAssessmentPrompt = `
You are EduMentor, an AI tutor inside an LMS.

The student is trying to get answers for an assessment.
Do NOT solve or give answers.

Instead:
- One short, friendly sarcastic line
- 2–3 similar practice questions

Do NOT explain solutions.
`;

    const explainAssessmentPrompt = `
You are EduMentor, an AI tutor inside an LMS.

This is an assessment.
Explain concepts ONLY to help understanding.
Do NOT solve or give final answers.

Question:
"${sanitizedQuestion}"
`;

    // Build RAG-enhanced prompt for normal questions
    let normalPrompt = buildRAGPrompt(sanitizedQuestion, localContext, {
      difficulty,
      includeContext: localContext.hasContext,
    });

    // Add conversation context if available
    if (shouldUseContext) {
      normalPrompt = normalPrompt.replace(
        "STUDENT QUESTION:",
        `PREVIOUS CONVERSATION:\n${conversationContext}\n\nSTUDENT QUESTION:`
      );
    }

    // --------------------------------------------------
    // 5️⃣ File generation instructions (WITH SANITIZATION)
    // --------------------------------------------------
    if (requestedFileType !== "none") {
      const fileInstruction = `
IMPORTANT: The user requested a ${requestedFileType.toUpperCase()} file.
Provide ONLY a brief 2–3 sentence summary in chat.
The full content will be generated in the file.
`;

      normalPrompt = buildRAGPrompt(sanitizedQuestion, localContext, {
        difficulty,
        includeContext: localContext.hasContext,
      }).replace("STUDENT QUESTION:", `${fileInstruction}\n\nSTUDENT QUESTION:`);
    }

    // --------------------------------------------------
    // 6️⃣ Final prompt selection
    // --------------------------------------------------
    let finalPromptText;

    if (isAssessmentFile && isAnswerSeeking) {
      finalPromptText = blockAssessmentPrompt;
    } else if (isAssessmentFile && !isAnswerSeeking) {
      finalPromptText = explainAssessmentPrompt;
    } else {
      finalPromptText = normalPrompt;
    }

    // --------------------------------------------------
    // 7️⃣ Sanitize final prompt before sending to AI
    // --------------------------------------------------
    const { sanitizedPrompt: finalSanitizedPrompt, blocked: promptBlocked } = 
      sanitizeAIPrompt(finalPromptText);

    if (promptBlocked) {
      return res.status(400).json({
        success: false,
        error: "FERPA_COMPLIANCE",
        message: "Unable to process request due to sensitive information in prompt.",
      });
    }

    // --------------------------------------------------
    // 8️⃣ Gemini input (WITH SANITIZED PROMPT)
    // --------------------------------------------------
    const parts = [{ text: finalSanitizedPrompt }];

    if (file) {
      const buffer = fs.readFileSync(file.path);
      parts.push({
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.mimetype,
        },
      });
    }

    const aiResponse = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    let answer = aiResponse.response.text();
    let fileContent = answer;

    // --------------------------------------------------
    // 9️⃣ Generate full content for files (WITH SANITIZATION)
    // --------------------------------------------------
    if (requestedFileType !== "none") {
      const detailedPrompt = buildRAGPrompt(sanitizedQuestion, localContext, {
        includeContext: localContext.hasContext,
      }).replace(
        "STUDENT QUESTION:",
        `Provide comprehensive educational content for:\n"${sanitizedQuestion}"\n\nInclude explanations, examples, and structure.\nFormat for a ${requestedFileType.toUpperCase()} document.`
      );

      const detailedResponse = await model.generateContent(detailedPrompt);
      fileContent = detailedResponse.response.text();
    }

    // --------------------------------------------------
    // 🔟 Generate file (PRESERVED)
    // --------------------------------------------------
    let generatedFileUrl = null;
    let generatedFileName = null;

    if (requestedFileType !== "none") {
      const uploadDir = path.join(process.cwd(), "uploads", "file");
      if (!fs.existsSync(uploadDir))
        fs.mkdirSync(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);

      const extMap = { pdf: ".pdf", word: ".docx", excel: ".xlsx" };
      generatedFileName = `generated-${timestamp}-${random}${extMap[requestedFileType]}`;
      const generatedPath = path.join(uploadDir, generatedFileName);

      if (requestedFileType === "pdf")
        await generatePDF(fileContent, generatedPath);
      if (requestedFileType === "word")
        await generateWord(fileContent, generatedPath);
      if (requestedFileType === "excel")
        await generateExcel(fileContent, generatedPath);

      generatedFileUrl = `${process.env.ASSET_URL}uploads/file/${generatedFileName}`;
    }

    // --------------------------------------------------
    // 1️⃣1️⃣ Validation and suggestions (WITH SANITIZATION)
    // --------------------------------------------------
    const validationPrompt = `
Is this a meaningful academic question? Reply only "yes" or "no".

"${sanitizedQuestion}"
`;

    const validCheck = await model.generateContent(validationPrompt);
    const isMeaningful =
      validCheck.response.text().trim().toLowerCase() === "yes";

    let suggestedQuestions = [];

    if (isMeaningful) {
      const suggestions = await model.generateContent(`
Generate exactly 5 practice questions based on:
"${sanitizedQuestion}"
One per line, plain English, no bullets.
`);

      suggestedQuestions = suggestions.response
        .text()
        .split("\n")
        .map((q) => q.trim())
        .filter((q) => q.length > 3)
        .slice(0, 5);
    }

    // --------------------------------------------------
    // FERPA COMPLIANCE: Audit Logging
    // --------------------------------------------------
    
    // Log PII detection events
    if (questionSanitizationReport.hasPII) {
      const piiAuditLog = generatePIIAuditLog(
        questionSanitizationReport,
        userId,
        'question_sanitization'
      );
      await logApiCall({
        method: req.method,
        route: req.originalUrl,
        userId,
        statusCode: 200,
        responseTime: 0,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: piiAuditLog,
      });
    }

    if (fileSanitizationReport) {
      await logApiCall({
        method: req.method,
        route: req.originalUrl,
        userId,
        statusCode: 200,
        responseTime: 0,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: fileSanitizationReport,
      });
    }

    // Store the ORIGINAL question in database (for student records)
    // but send only SANITIZED data to AI
    await AIChat.create({
      userId,
      districtId,
      schoolId,
      question: { text: question, sender: "user" }, // Store original for FERPA "Right to Inspect"
      answer: { text: answer, sender: "ai" },
      difficulty,
      file: file
        ? {
          url: file.path,
          filename: file.originalname,
          sender: "user",
        }
        : null,
      fileUsed: file ? file.originalname : null,
      generatedFile: generatedFileUrl
        ? {
          url: generatedFileUrl,
          filename: generatedFileName,
          sender: "ai",
          FileType: requestedFileType,
        }
        : null,
      // FERPA compliance metadata
      _ferpaMetadata: {
        questionSanitized: questionSanitizationReport.hasPII,
        fileScanned: file ? true : false,
        fileSafe: fileSafeToSend,
        usedLocalContext: localContext.hasContext,
        ragSources: localContext.sources,
        dataSentToAI: 'sanitized_prompt_only',
      },
    });

    res.json({
      success: true,
      question, // Return original question to user
      answer,
      suggestedQuestions,
      fileUsed: file ? file.originalname : null,
      generatedFile: generatedFileUrl
        ? {
          url: generatedFileUrl,
          filename: generatedFileName,
          FileType: requestedFileType,
        }
        : null,
      // FERPA compliance info
      ferpaCompliance: {
        questionSanitized: questionSanitizationReport.hasPII,
        fileScanned: file ? true : false,
        usedLocalContext: localContext.hasContext,
        dataProtection: 'active',
      },
    });
  } catch (err) {
    console.error("AI Error", err);
    res.status(500).json({ error: "AI Processing Failed" });
  }
};

// FERPA COMPLIANCE: Helper functions for file generation
async function generatePDF(content, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Add title
    doc.fontSize(18).font("Helvetica-Bold").text("EduMentor AI Response", {
      align: "center",
    });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Add content
    doc.fontSize(12).font("Helvetica").text(content, {
      align: "left",
      lineGap: 5,
    });

    // Add footer
    doc.moveDown(2);
    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", reject);
  });
}

async function generateWord(content, filePath) {
  // Parse content into paragraphs
  const paragraphs = content
    .split("\n")
    .filter((p) => p.trim())
    .map(
      (p) =>
        new Paragraph({
          children: [new TextRun(p)],
          spacing: { after: 200 },
        })
    );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "EduMentor AI Response",
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${new Date().toLocaleString()}`,
                italics: true,
                size: 20,
                color: "666666",
              }),
            ],
            spacing: { after: 400 },
          }),
          ...paragraphs,
          new Paragraph({
            children: [
              new TextRun({
                text: "___",
                size: 20,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Powered by EduMentor AI",
                italics: true,
                size: 20,
                color: "999999",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function generateExcel(content, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("AI Response");

  // Add header
  worksheet.addRow(["EduMentor AI Response"]);
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  worksheet.getRow(1).font = {
    bold: true,
    size: 16,
    color: { argb: "FFFFFFFF" },
  };

  // Add timestamp
  worksheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
  worksheet.getRow(2).font = { italic: true, size: 10 };

  // Add empty row
  worksheet.addRow([]);

  // Split content into rows
  const lines = content.split("\n").filter((l) => l.trim());

  lines.forEach((line) => {
    worksheet.addRow([line]);
  });

  // Auto-fit columns
  worksheet.columns = [{ width: 100 }];

  // Add borders
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 2) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

export const generateContentForTeacher = async (req, res) => {
  try {
    const { command, usedfor, difficulty, bookRefrence } = req.body;
    const { districtId, schoolId } = req.user;

    let bookRef = null;
    if (bookRefrence) {
      bookRef = await Book.findOne({ _id: bookRefrence, districtId, schoolId });
    }

    // 2. Define Context-Specific Instructions
    const sourceContext = bookRef
      ? `SOURCE MATERIAL (Use this for reference):\n"${bookRef.rawText}" Subject:\"${bookRef.subject}"`
      : `SOURCE MATERIAL: Use your general educational knowledge (No specific book provided).`;

    const specificInstruction = bookRef
      ? `Strictly prioritize the "SOURCE MATERIAL" above. If the teacher asks for a specific chapter or lesson, extract it from that text.`
      : `Generate high-quality, accurate educational content based on the user's command.`;

    const prompt = `
You are EduMentor AI, an expert educational content creator for a Learning Management System (LMS).

${sourceContext}

TASK:
Generate content for: "${usedfor}"
${specificInstruction}

INSTRUCTIONS (VERY IMPORTANT):
- Generate ONLY the final usable content.
- Do NOT include explanations, introductions, labels, or meta text.
- Do NOT mention that you are an AI.
- Do NOT include markdown unless explicitly required by the content type.
- Content must be clear, concise, and ready to be saved directly in the LMS database.

CONTENT RULES BY TYPE:
- If usedfor = "course_title":
  • Output a single clear, engaging course title (max 12 words)

- If usedfor = "courseDescription":
  • Output 1–2 short paragraphs
  • Written for students
  • No bullet points

- If usedfor = "teachingPoints":
  • Output 1–12 concise bullet points
  • Each point should be actionable and instructional

- If usedfor = "requirements":
  • Output 1–12 concise bullet points
  • Each point should be actionable and instructional  

- If usedfor = "chapterTitle":
  • Output a single clear, engaging chapter title (max 12 words)

- If usedfor = "chapterDescription":
  • Output 1–2 short paragraphs
  • Written for students
  • No bullet points
  • Not more then 500 characters
  
- If usedfor = "lessonTitle":
  • Output a single clear, engaging lesson title (max 12 words)

- If usedfor = "lessonDescription":
  • Output 1–2 short paragraphs
  • Written for students
  • No bullet points   

- If usedfor = "assessmentTitle":
  • Output a single clear, engaging chapter title (max 12 words)

- If usedfor = "assessmentDescription":
  • Output 1–2 short paragraphs
  • Written for students
  • No bullet points 

- If usedfor = "question-mcq":
  • Output 1 short questions according to the difficulty of ${difficulty} with 4 options labeled as A, B, C, D.
  • provide the full correct answer in another line as Answer: [correct answer] without the labels (A, B, C, D).
  • Written for students
  • No bullet points

- If usedfor = "question-truefalse":
  • Output 1 short questions to the difficulty of ${difficulty} with 2 options each
  • Indicate the correct answer in another line with headings "True" or "False"
  • Written for students
  • No bullet points

- If usedfor = "question-qa":
  • Output 1 short questions to the difficulty of ${difficulty}.
  • Written for students
  • No bullet points  


INPUT COMMAND:
"${command}"

Generate content now.
`;

    const aiResponse = await model.generateContent(prompt);

    console.log(aiResponse, "aiResponse")

    res.json({
      success: true,
      usedfor,
      content: aiResponse.response.text().trim(),
    });
  } catch (error) {
    console.error("error in generateContentForTeacher", error);
    res.status(500).json({ message: "Failed to generate content for teacher" });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { prompt, aspectRatio, numberOfImages } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    // Call our utility function
    const result = await model.generateImage({ prompt, aspectRatio, numberOfImages });

    res.status(200).json({
      success: true,
      mimeType: result.mimeType,
      imageBase64: result.imageBase64,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate image",
      error: error.message,
    });
  }
};

export const uploadBook = async (req, res) => {
  const { districtId, schoolId } = req.user
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 1. Upload the file to Google AI File API
    const uploadResult = await fileManager.uploadFile(req.file.path, {
      mimeType: "application/pdf",
      displayName: req.body.title || "Uploaded Book",
    });

    // 2. Generate content using the File URI
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: "Please extract all the text of this document and create bullet points for each chapter or it can be with there subchapters or lessons. which can use to generate the content based on these bullet points." },
    ]);

    const aiExtractedText = result.response.text();

    // 3. Save reference and AI analysis to your backend
    const fileUrl = `${process.env.ASSET_URL}uploads/file/${req.file.filename}`;

    const book = await Book.create({
      title: req.body.title,
      subject: req.body.subject,
      rawText: aiExtractedText,
      originalfile: fileUrl,
      googleFileUri: uploadResult.file.uri,
      districtId,
      schoolId
    });

    res.json({ success: true, bookId: book._id, analysis: aiExtractedText });
  } catch (err) {
    console.error("AI File Processing Error:", err);
    res.status(500).json({ message: "AI failed to read the file" });
  }
};

export const getAllBooks = async (req, res) => {
  const { districtId, schoolId } = req.user
  try {
    const books = await Book.find({ districtId, schoolId }).sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Error fetching books", error: err.message });
  }
};