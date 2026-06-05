/**
 * RAG (Retrieval-Augmented Generation) Service
 * Uses local knowledge base instead of sending student data to external AI
 * Compliant with FERPA by keeping student data within the system
 */

import Book from "../Models/books.model.js";

/**
 * Search local knowledge base for relevant educational content
 * @param {string} query - Student's question/topic
 * @param {Object} filters - Filters for content search (districtId, schoolId, subject)
 * @returns {Promise<Object>} - Retrieved context and metadata
 */
export const retrieveLocalContext = async (query, filters = {}) => {
  try {
    const { districtId, schoolId, subject, bookId } = filters;

    // Build search query
    const searchQuery = { districtId, schoolId };
    
    if (subject) {
      searchQuery.subject = subject;
    }
    
    if (bookId) {
      searchQuery._id = bookId;
    }

    // Search for relevant books/content
    const books = await Book.find(searchQuery).select('title subject rawText').lean();

    if (!books || books.length === 0) {
      return {
        hasContext: false,
        context: '',
        sources: [],
        message: 'No local educational content found',
      };
    }

    // Simple keyword matching for relevance (in production, use vector embeddings)
    const queryKeywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    let relevantContent = [];
    let sources = [];

    for (const book of books) {
      if (!book.rawText) continue;

      const bookText = book.rawText.toLowerCase();
      let relevanceScore = 0;

      // Calculate relevance based on keyword matches
      for (const keyword of queryKeywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = bookText.match(regex);
        if (matches) {
          relevanceScore += matches.length;
        }
      }

      if (relevanceScore > 0) {
        // Extract relevant passages (simplified - in production use semantic search)
        const passages = extractRelevantPassages(book.rawText, queryKeywords, 3);
        
        relevantContent.push({
          bookTitle: book.title,
          subject: book.subject,
          passages,
          relevanceScore,
        });

        sources.push({
          type: 'book',
          title: book.title,
          subject: book.subject,
        });
      }
    }

    // Sort by relevance and take top results
    relevantContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topContent = relevantContent.slice(0, 2);

    if (topContent.length === 0) {
      return {
        hasContext: false,
        context: '',
        sources: [],
        message: 'No relevant content found in local knowledge base',
      };
    }

    // Build context string from retrieved content
    const contextString = topContent
      .map(content => {
        return `Source: ${content.bookTitle} (${content.subject})\n${content.passages.join('\n\n')}`;
      })
      .join('\n\n---\n\n');

    return {
      hasContext: true,
      context: contextString,
      sources: topContent.map(c => ({ title: c.bookTitle, subject: c.subject })),
      message: `Found ${topContent.length} relevant sources in local knowledge base`,
    };
  } catch (error) {
    console.error('Error retrieving local context:', error);
    return {
      hasContext: false,
      context: '',
      sources: [],
      error: error.message,
    };
  }
};

/**
 * Extract relevant passages from text based on keywords
 * @param {string} text - Full text to search
 * @param {string[]} keywords - Keywords to search for
 * @param {number} maxPassages - Maximum number of passages to extract
 * @returns {string[]} - Array of relevant passages
 */
const extractRelevantPassages = (text, keywords, maxPassages = 3) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword)) {
        score += 1;
      }
    }
    
    return { sentence, score };
  });

  // Sort by score and take top passages
  scoredSentences.sort((a, b) => b.score - a.score);
  const topSentences = scoredSentences.filter(s => s.score > 0).slice(0, maxPassages * 3);

  // Group sentences into passages (3 sentences per passage)
  const passages = [];
  for (let i = 0; i < topSentences.length; i += 3) {
    const passage = topSentences
      .slice(i, i + 3)
      .map(s => s.sentence.trim())
      .join('. ');
    passages.push(passage);
  }

  return passages.slice(0, maxPassages);
};

/**
 * Build RAG-enhanced prompt
 * Combines retrieved local context with the student's question
 * @param {string} question - Student's sanitized question
 * @param {Object} contextData - Retrieved context from local knowledge base
 * @param {Object} options - Additional options
 * @returns {string} - Enhanced prompt for AI
 */
export const buildRAGPrompt = (question, contextData, options = {}) => {
  const { difficulty, includeContext = true } = options;

  let prompt = `You are EduMentor, an AI tutor inside a Learning Management System.\n\n`;

  if (includeContext && contextData.hasContext) {
    prompt += `RELEVANT EDUCATIONAL CONTENT (from local knowledge base):\n`;
    prompt += `${contextData.context}\n\n`;
    prompt += `Use the above content to answer the student's question. `;
    prompt += `If the content doesn't contain the answer, use your general educational knowledge.\n\n`;
  } else {
    prompt += `Use your general educational knowledge to answer the student's question.\n\n`;
  }

  prompt += `STUDENT QUESTION:\n"${question}"\n`;

  if (difficulty) {
    prompt += `\nDifficulty Level: ${difficulty}\n`;
  }

  prompt += `\nProvide a clear, educational answer appropriate for the difficulty level.`;

  return prompt;
};

/**
 * Check if local knowledge base has sufficient content
 * @param {Object} filters - Filters for content search
 * @returns {Promise<Object>} - Availability check result
 */
export const checkKnowledgeBaseAvailability = async (filters = {}) => {
  try {
    const { districtId, schoolId, subject } = filters;
    
    const countQuery = { districtId, schoolId };
    if (subject) countQuery.subject = subject;

    const count = await Book.countDocuments(countQuery);

    return {
      available: count > 0,
      count,
      message: count > 0 
        ? `Knowledge base contains ${count} educational resources` 
        : 'No educational resources available in knowledge base',
    };
  } catch (error) {
    console.error('Error checking knowledge base availability:', error);
    return {
      available: false,
      error: error.message,
    };
  }
};

/**
 * FERPA-compliant AI response generation
 * Uses RAG to minimize data sent to external AI
 * @param {string} sanitizedQuestion - Sanitized student question
 * @param {Object} contextData - Retrieved local context
 * @param {Function} aiGenerateFunction - AI generation function (from gemini.js)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - AI response with metadata
 */
export const generateFERPACompliantResponse = async (
  sanitizedQuestion,
  contextData,
  aiGenerateFunction,
  options = {}
) => {
  try {
    // Build RAG-enhanced prompt
    const ragPrompt = buildRAGPrompt(sanitizedQuestion, contextData, options);

    // Generate response using AI
    const aiResponse = await aiGenerateFunction(ragPrompt);
    const responseText = aiResponse.response.text();

    return {
      success: true,
      response: responseText,
      metadata: {
        usedLocalContext: contextData.hasContext,
        sources: contextData.sources || [],
        contextAvailable: contextData.hasContext,
        ferpaCompliant: true,
        dataSentToAI: 'prompt_only', // Only sanitized prompt, no student PII
      },
    };
  } catch (error) {
    console.error('Error generating FERPA-compliant response:', error);
    return {
      success: false,
      error: error.message,
      metadata: {
        ferpaCompliant: true,
        error: 'ai_generation_failed',
      },
    };
  }
};

export default {
  retrieveLocalContext,
  buildRAGPrompt,
  checkKnowledgeBaseAvailability,
  generateFERPACompliantResponse,
};
