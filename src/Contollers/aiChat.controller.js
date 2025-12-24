import model from "../../utils/gemini.js";
import fs from "fs";
import AIChat from "../Models/AIChat.model.js"
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';
import path from 'path';

export const getChatHistory = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const userId = req.user._id;
        const chats = await AIChat.find({ userId }).limit(limit)

        res.json({ success: true, chats });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "getChatHistory" });
    }
}

export const askAIupdated = async (req, res) => {
    const userId = req.user._id;

    try {
        const { question, difficulty, context } = req.body;
        const file = req.file;

        let conversationContext = "";
        let shouldUseContext = false;

        const history = await AIChat.findOne({ userId }).sort({ createdAt: -1 });

        if (context) {
            const messageContext = await AIChat.findById(context);
            if (messageContext) {
                conversationContext += `Student: ${messageContext.question}\n`;
                conversationContext += `Tutor: ${messageContext.answer}\n`;
                shouldUseContext = true;
            }
        }

        // --------------------------------------------------
        // 1️⃣ Detect assessment file (AI-based)
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
"${question}"
`;

            const assessmentCheck = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [
                        { text: assessmentPrompt },
                        {
                            inlineData: {
                                data: base64,
                                mimeType: file.mimetype
                            }
                        }
                    ]
                }]
            });

            isAssessmentFile =
                assessmentCheck.response.text().trim().toLowerCase() === "yes";
        }

        // --------------------------------------------------
        // 2️⃣ Detect student intent (answer vs understanding)
        // --------------------------------------------------
        let isAnswerSeeking = false;

        if (isAssessmentFile) {
            const intentPrompt = `
Reply ONLY "answer" or "understanding".

Answer = wants solution, final answer, solving.
Understanding = wants explanation, concept clarity.

Student message:
"${question}"
`;

            const intentCheck = await model.generateContent(intentPrompt);
            isAnswerSeeking =
                intentCheck.response.text().trim().toLowerCase() === "answer";
        }

        // --------------------------------------------------
        // 3️⃣ Detect file generation intent (PRESERVED)
        // Block ONLY if cheating attempt
        // --------------------------------------------------
        let requestedFileType = "none";

        if (!(isAssessmentFile && isAnswerSeeking)) {
            const fileGenerationPrompt = `
Analyze this user message.
Reply ONLY one word: "pdf", "word", "excel", or "none".

User message:
"${question}"
`;
            const fileTypeCheck = await model.generateContent(fileGenerationPrompt);
            requestedFileType = fileTypeCheck.response.text().trim().toLowerCase();
        }

        // --------------------------------------------------
        // 4️⃣ PROMPTS
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
"${question}"
`;

        let normalPrompt = `
You are EduMentor, an AI tutor inside an LMS.
Answer clearly in plain English.

Previous conversation:
${conversationContext}

Question:
"${question}"
Difficulty: ${difficulty}
`;

        // --------------------------------------------------
        // 5️⃣ File generation instructions (UNCHANGED)
        // --------------------------------------------------
        if (requestedFileType !== "none") {
            const fileInstruction = `
IMPORTANT: The user requested a ${requestedFileType.toUpperCase()} file.
Provide ONLY a brief 2–3 sentence summary in chat.
The full content will be generated in the file.
`;

            normalPrompt = `
You are EduMentor, an AI tutor inside an LMS.

${fileInstruction}

Question:
"${question}"
Difficulty: ${difficulty}
`;
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
        // 7️⃣ Gemini input
        // --------------------------------------------------
        const parts = [{ text: finalPromptText }];

        if (file) {
            const buffer = fs.readFileSync(file.path);
            parts.push({
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.mimetype
                }
            });
        }

        const aiResponse = await model.generateContent({
            contents: [{ role: "user", parts }]
        });

        let answer = aiResponse.response.text();
        let fileContent = answer;

        // --------------------------------------------------
        // 8️⃣ Generate full content for files (PRESERVED)
        // --------------------------------------------------
        if (requestedFileType !== "none") {
            const detailedPrompt = `
Provide comprehensive educational content for:
"${question}"

Include explanations, examples, and structure.
Format for a ${requestedFileType.toUpperCase()} document.
`;

            const detailedResponse = await model.generateContent(detailedPrompt);
            fileContent = detailedResponse.response.text();
        }

        // --------------------------------------------------
        // 9️⃣ Generate file (PRESERVED)
        // --------------------------------------------------
        let generatedFileUrl = null;
        let generatedFileName = null;

        if (requestedFileType !== "none") {
            const uploadDir = path.join(process.cwd(), 'uploads', 'file');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1e9);

            const extMap = { pdf: ".pdf", word: ".docx", excel: ".xlsx" };
            generatedFileName = `generated-${timestamp}-${random}${extMap[requestedFileType]}`;
            const generatedPath = path.join(uploadDir, generatedFileName);

            if (requestedFileType === "pdf") await generatePDF(fileContent, generatedPath);
            if (requestedFileType === "word") await generateWord(fileContent, generatedPath);
            if (requestedFileType === "excel") await generateExcel(fileContent, generatedPath);

            generatedFileUrl = `${process.env.ASSET_URL}/uploads/file/${generatedFileName}`;
        }

        // --------------------------------------------------
        // 🔟 Save chat (UNCHANGED)
        // --------------------------------------------------
        await AIChat.create({
            userId,
            question: { text: question, sender: "user" },
            answer: { text: answer, sender: "ai" },
            difficulty,
            file: file ? {
                url: file.path,
                filename: file.originalname,
                sender: "user"
            } : null,
            fileUsed: file ? file.originalname : null,
            generatedFile: generatedFileUrl ? {
                url: generatedFileUrl,
                filename: generatedFileName,
                sender: "ai",
                FileType: requestedFileType
            } : null
        });

        res.json({
            success: true,
            question,
            answer,
            fileUsed: file ? file.originalname : null,
            generatedFile: generatedFileUrl ? {
                url: generatedFileUrl,
                filename: generatedFileName,
                FileType: requestedFileType
            } : null
        });

    } catch (err) {
        console.error("AI Error", err);
        res.status(500).json({ error: "AI Processing Failed" });
    }
};


async function generatePDF(content, filePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Add title
        doc.fontSize(18).font('Helvetica-Bold').text('EduMentor AI Response', {
            align: 'center'
        });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        // Add content
        doc.fontSize(12).font('Helvetica').text(content, {
            align: 'left',
            lineGap: 5
        });

        // Add footer
        doc.moveDown(2);
        doc.fontSize(10).fillColor('gray').text(
            `Generated on ${new Date().toLocaleString()}`,
            { align: 'center' }
        );

        doc.end();

        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
    });
}

async function generateWord(content, filePath) {
    // Parse content into paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim()).map(p =>
        new Paragraph({
            children: [new TextRun(p)],
            spacing: { after: 200 }
        })
    );

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "EduMentor AI Response",
                            bold: true,
                            size: 32
                        })
                    ],
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Generated on ${new Date().toLocaleString()}`,
                            italics: true,
                            size: 20,
                            color: "666666"
                        })
                    ],
                    spacing: { after: 400 }
                }),
                ...paragraphs,
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "___",
                            size: 20
                        })
                    ],
                    spacing: { before: 400, after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Powered by EduMentor AI",
                            italics: true,
                            size: 20,
                            color: "999999"
                        })
                    ]
                })
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function generateExcel(content, filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AI Response');

    // Add header
    worksheet.addRow(['EduMentor AI Response']);
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };

    // Add timestamp
    worksheet.addRow([`Generated on: ${new Date().toLocaleString()}`]);
    worksheet.getRow(2).font = { italic: true, size: 10 };

    // Add empty row
    worksheet.addRow([]);

    // Split content into rows
    const lines = content.split('\n').filter(l => l.trim());

    lines.forEach(line => {
        worksheet.addRow([line]);
    });

    // Auto-fit columns
    worksheet.columns = [{ width: 100 }];

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }
    });

    await workbook.xlsx.writeFile(filePath);
    return filePath;
}


export const generateContentForTeacher = async (req, res) => {
    try {
        const { command, usedfor } = req.body;

        const prompt = `
You are EduMentor AI, an expert educational content creator for a Learning Management System (LMS).

TASK:
Generate content strictly for the following purpose:
"${usedfor}"

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

- If usedfor = "learning_objectives":
  • Output 1-12 bullet points
  • Start each point with an action verb (e.g., Understand, Apply, Analyze)

- If usedfor = "lesson_outline":
  • Output a structured outline with short headings and subpoints

INPUT COMMAND:
"${command}"

Generate content now.
`;

        const aiResponse = await model.generateContent(prompt);

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