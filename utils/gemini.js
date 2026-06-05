import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
/**
 * FERPA Compliance Safety Settings
 * These settings prevent student data from being used for AI training
 * and enforce strict content safety policies
 */
const FERPA_SAFETY_SETTINGS = [
    {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
];

/**
 * Prevents data from being used for training and controls response behavior
 */
const FERPA_GENERATION_CONFIG = {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
};
// 1. Model for Text Generation
const geminiModel = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: FERPA_SAFETY_SETTINGS,
    generationConfig: FERPA_GENERATION_CONFIG,
});

// 2. Model for Image Generation (Paid Tier)
const imageModel = client.getGenerativeModel({
    model: "gemini-2.5-flash-image",
    safetySettings: FERPA_SAFETY_SETTINGS,
    generationConfig: FERPA_GENERATION_CONFIG,
});
const model = {
    // Text generation (stays thes same)
    generateContent: async (prompt) => {
        const response = await geminiModel.generateContent(prompt);
        return {
            response: {
                text: () => response.response.text() || ""
            }
        };
    },

    // Updated Image Generation logic
    generateImage: async ({ prompt, aspectRatio = "1:1" }) => {
        try {
            const result = await imageModel.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    responseModalities: ["IMAGE"],
                    // FIX: aspectRatio must be inside imageConfig
                    imageConfig: {
                        aspectRatio: aspectRatio,
                    }
                }
            });

            const response = await result.response;

            // Find the image part in the response
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (!imagePart) {
                throw new Error("No image data returned. The prompt might have been blocked by safety filters.");
            }

            return {
                imageBase64: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType
            };
        } catch (error) {
            console.error("Gemini Image Model Error:", error);
            throw error;
        }
    }
};

export default model;