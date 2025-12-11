import Chat from "../Models/AIChat.model.js";
import model from "../../utils/gemini.js";
import difficultyPrompts from "../../utils/difficultyPrompts.js";
import AIChat from "../Models/AIChat.model.js";
import crypto from "crypto";

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
        const { question, difficulty, context } = req.body;
        
        let conversationContext = "";
        let messageContext = null;
        let shouldUseContext = false;

        // ------------------------------------------
        // 1. Load last 5 messages
        // ------------------------------------------
        const history = await AIChat.findOne({ userId })
            .sort({ createdAt: -1 })
            .limit(1);


        if (context) {
            messageContext = await AIChat.findById(context);

            if (messageContext) {
                conversationContext += `Student: ${messageContext.question}\n`;
                conversationContext += `Tutor: ${messageContext.answer}\n`;
            }
            shouldUseContext = true
        }

        const GENERIC_FOLLOWUP_PATTERNS = [
            "explain more",
            "tell me more",
            "what do you mean",
            "continue",
            "go on",
            "more",
            "more details",
            "explain this",
            "explain that",
            "i don't understand",
            "elaborate",
            "clarify",
            "explain again",
            "explain better",
            "what else",
            "expand this",
            "can you explain",
            "explain it",
            "explain in simple words"
        ];

        function isGenericFollowUp(q) {
            const lower = q.toLowerCase().trim();
            return GENERIC_FOLLOWUP_PATTERNS.some(pattern => lower.includes(pattern));
        }

        let aiFollowUp = false;

        // If user is asking generic "Explain more", skip AI check
        if (isGenericFollowUp(question)) {
            aiFollowUp = true;
            conversationContext += `Student: ${history.question}\n`;
            // conversationContext += `Tutor: ${history.answer}\n`;
            shouldUseContext = true;
        }

        console.log(conversationContext, "conversationContext")

        const contextedPrompt = `
You are EduMentor, an AI tutor inside an LMS.

Here is the recent conversation:
${conversationContext}

Continue naturally from the last explanation.
Use the context above to understand what the student means.

Rules:
- Plain English only
- No markdown
- No symbols
- No numbering
- Short for simple questions
- Detailed only for complex concepts

Now answer:
"${question}"
`;

        const normalPrompt = `
You are EduMentor, an AI tutor inside an LMS.

Rules:
- Use plain English
- No markdown
- Short for simple questions
- Detailed only for complex topics

Question: "${question}"
Difficulty: "${difficulty}"
`;

        const finalPrompt = shouldUseContext ? contextedPrompt : normalPrompt;

        console.log(finalPrompt, "finalPrompt")

        // ------------------------------------------
        // 8. Generate AI answer
        // ------------------------------------------
        const answerResult = await model.generateContent(finalPrompt);
        const answer = cleanText(answerResult.response.text());

        // ------------------------------------------
        // 9. Validate question before generating suggestions
        // ------------------------------------------
        const validationPrompt = `
Is this a meaningful academic question?

"${question}"

Reply only with: yes or no
`;

        const validResult = await model.generateContent(validationPrompt);
        const isMeaningful =
            validResult.response.text().trim().toLowerCase() === "yes";

        let suggestedQuestions = [];

        // ------------------------------------------
        // 10. If valid: generate 5 practice questions
        // ------------------------------------------
        if (isMeaningful) {
            const suggestionPrompt = `
Generate exactly five related practice questions based on:

"${question}"

Rules:
- Plain English only
- No bullets
- No symbols
- One question per line
- Do not repeat original question
- Match difficulty: ${difficulty}
`;

            const suggestionResult = await model.generateContent(suggestionPrompt);

            suggestedQuestions = suggestionResult.response.text()
                .split("\n")
                .map(q => cleanText(q).trim())
                .filter(q => q.length > 3)
                .slice(0, 5);
        }

        const updatedQuestion = {
            text: question,
            sender: 'user'
        }

        const updatedAnswer = {
            text: answer,
            sender: 'ai'
        }

        await AIChat.create({
            userId,
            question: updatedQuestion,
            answer: updatedAnswer,
            difficulty
        });

        res.json({
            id: crypto.randomBytes(10).toString('hex'),
            success: true,
            question: updatedQuestion,
            answer: updatedAnswer,
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
        const chats = await AIChat.find({ userId }).limit(limit)

        res.json({ success: true, chats });

        console.log(chats, "chats")
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "getChatHistory" });
    }
}
