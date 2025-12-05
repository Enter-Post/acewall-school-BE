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
        let useImplicitContext = false;

        // Difficulty_prompt definitions (REQUIRED)
        const difficultyPrompts = {
            easy: "Use simple everyday words and short sentences.",
            medium: "Use school-level explanations with clear logic.",
            hard: "Use advanced academic detail with proper terminology."
        };

        // 1. Load last 5 messages
        const history = await AIChat.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5);

        const orderedHistory = [...history].reverse();

        // 2. Manual tagged message context
        if (context) {
            messageContext = await AIChat.findById(context);
            if (messageContext) {
                conversationContext += `Student: ${messageContext.question}\n`;
                conversationContext += `Tutor: ${messageContext.answer}\n`;
            }
        }

        // 3. Keyword-based implicit context detection
        const implicitPhrases = [
            "explain", "explain more", "simplify", "simplify this", "simplify it",
            "continue", "tell me more", "more details", "make it simple",
            "make it easier", "i don't understand", "didn't understand",
            "clear it", "what do you mean", "above answer", "previous answer",
            "previous message", "go deeper", "break it down"
        ];

        const lowered = question.toLowerCase();
        useImplicitContext = implicitPhrases.some(p => lowered.includes(p));

        // 4. AI-based follow-up detection
        const referenceCheckPrompt = `
The student asked: "${question}"

Does this question refer to the previous answer or explanation?
A follow-up question means:
- asking to explain again
- asking for easier explanation
- asking to continue
- referencing "that", "it", "previous"

Reply with exactly one word:
yes or no
        `;

        const followCheckResult = await model.generateContent(referenceCheckPrompt);
        const isFollowUp =
            followCheckResult.response.text().trim().toLowerCase() === "yes";

        // 5. Final decision to use context
        const shouldUseContext =
            messageContext || useImplicitContext || isFollowUp;

        // Add only last exchange if context needed
        if (shouldUseContext && history.length > 0) {
            const last = history[0];
            conversationContext += `Student: ${last.question}\n`;
            conversationContext += `Tutor: ${last.answer}\n`;
        }

        // Add conversation flow (last 5)
        orderedHistory.forEach(entry => {
            conversationContext += `Student: ${entry.question}\n`;
            conversationContext += `Tutor: ${entry.answer}\n`;
        });

        // 6. Build prompts
        const contextedPrompt = `
You are EduMentor, an AI tutor inside an LMS.

Here is the recent conversation:
${conversationContext}

Use this context to understand what the student means.
Continue naturally from the last explanation.

Rules:
- Plain English only.
- No Markdown.
- No symbols.
- No numbering.
- Short for simple questions.
- Detailed only for complex concepts.

Now answer this new student question:
"${question}"
        `;

        const normalPrompt = `
You are EduMentor, an AI tutor inside an LMS.

Rules:
- Use plain English.
- No markdown.
- Short for simple questions.
- Detailed only for complex topics.

Question: "${question}"
Difficulty: "${difficulty}"
        `;

        const finalPrompt = shouldUseContext ? contextedPrompt : normalPrompt;

        // 7. Generate main AI answer
        const answerResult = await model.generateContent(finalPrompt);
        const answer = cleanText(answerResult.response.text());

        // 8. Validate question before generating suggestions
        const validationPrompt = `
Is this a meaningful academic question?

"${question}"

Reply only with: yes or no
        `;

        const validResult = await model.generateContent(validationPrompt);
        const isMeaningful =
            validResult.response.text().trim().toLowerCase() === "yes";

        console.log(isMeaningful, "isMeaningful")

        let suggestedQuestions = [];

        // 9. Generate suggested questions if suitable
        if (isMeaningful) {
            const suggestionPrompt = `
Generate exactly five practice questions based on:

"${question}"

Rules:
- Plain English only
- No bullets
- No symbols
- One question per line
- Do not repeat original question
- Must match difficulty: ${difficulty}

${difficultyPrompts[difficulty]}
            `;

            const suggestionResult = await model.generateContent(suggestionPrompt);

            suggestedQuestions = suggestionResult.response.text()
                .split("\n")
                .map(q => cleanText(q).trim())
                .filter(q => q.length > 3)
                .slice(0, 5);
        }

        // 10. Save chat
        await AIChat.create({
            userId,
            question,
            answer,
            difficulty
        });

        // 11. Response
        res.json({
            id: crypto.randomBytes(10).toString('hex'),
            success: true,
            question,
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
