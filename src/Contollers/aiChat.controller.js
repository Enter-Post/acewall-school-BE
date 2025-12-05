import Chat from "../Models/AIChat.model.js";
import model from "../../utils/gemini.js";
import difficultyPrompts from "../../utils/difficultyPrompts.js";
import AIChat from "../Models/AIChat.model.js";

// Function to clean Markdown and unwanted characters
function cleanText(text) {
    return text
        .replace(/[*#_`~>-]/g, "")      // remove markdown symbols
        .replace(/\\/g, "")             // remove backslashes
        .replace(/\n{3,}/g, "\n\n")     // normalize line breaks
        .trim();
}

export const askAI = async (req, res) => {
    const userId = req.user._id;

    try {
        const { question, difficulty } = req.body;

        // 1. Generate the main answer in plain text only
        const answerPrompt = `
You are EduMentor, an AI tutor inside an LMS.
Use plain English only.
No Markdown.
No symbols, no bullet points, no lists, no headings.
Write in simple paragraphs.

Important rules:
1. If the student's question is simple, direct, or involves basic arithmetic, give a short answer in one or two sentences.
2. If the question requires explanation (concepts, reasoning, definitions, multi-step problem solving), give a helpful explanation.
3. Do NOT over-explain basic questions.
4. Always match the student's difficulty level.

Question: "${question}"
Difficulty: "${difficulty}"

Write the best response now.
`;

        const answerResult = await model.generateContent(answerPrompt);
        let answer = cleanText(answerResult.response.text());

        // 2. Ask AI if the question is meaningful
        const validationPrompt = `
You are evaluating a student's question.

Question: "${question}"

Respond with ONLY ONE WORD:
yes  = meaningful academic question
no   = nonsense, gibberish, not understandable
        `;

        const validationResult = await model.generateContent(validationPrompt);
        const isMeaningful = validationResult.response.text().trim().toLowerCase();

        let suggestedQuestions = [];

        // 3. Generate suggestions only IF meaningful
        if (isMeaningful === "yes") {

            const suggestionPrompt = `
You are EduMentor, an LMS-based AI tutor.

The student's question is: "${question}"
Difficulty level: "${difficulty}"

Generate exactly five new practice questions on the same topic.
They must:
- Match the student's selected difficulty level.
- Avoid repeating the original question.
- Be written in plain English.
- Be written one question per line.
- Use no numbering, no bullets, no special symbols.
- Use no Markdown.

${difficultyPrompts[difficulty]}

Write the five questions now.
            `;

            const suggestionResult = await model.generateContent(suggestionPrompt);

            suggestedQuestions = suggestionResult.response.text()
                .split("\n")
                .map(q => cleanText(q).trim())
                .filter(q => q.length > 3)
                .slice(0, 5);
        }

        // 4. Save chat
        await Chat.create({
            userId,
            question,
            answer,
            difficulty
        });

        // 5. Return final clean response
        res.json({
            success: true,
            answer,
            suggestedQuestions
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "AI Error" });
    }
};

export const getChatHistory = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        const userId = req.user._id;
        const chats = await AIChat.find({ userId }).limit(limit).sort({ createdAt: -1 });

        res.json({ success: true, chats });

        console.log(chats, "chats")
    } catch (error) {
        console.error(err);
        res.status(500).json({ error: "getChatHistory" });
    }
}
