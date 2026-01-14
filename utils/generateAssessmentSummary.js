import model from "./gemini.js";

const generateAssessmentSummary = async ({
    studentName,
    assessmentTitle,
    score,
    maxScore,
    masteredConcept,
    needAssistantconcepts,
}) => {
    const prompt = `
You are an AI academic tutor.

Create a concise, encouraging assessment summary for a student email.

Details:
- Student Name: ${studentName}
- Assessment: ${assessmentTitle}
- Score: ${score}/${maxScore}
- Mastered Concepts: ${masteredConcept.join(", ") || "None"}
- Needs Improvement: ${needAssistantconcepts.join(", ") || "None"}

Rules:
- Keep it under 120 words
- Use simple language
- Encourage improvement
- Do NOT use markdown
- Output plain text only
`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        console.error("AI Summary Error:", err);
        return null; // fallback safe
    }
};

export default generateAssessmentSummary;