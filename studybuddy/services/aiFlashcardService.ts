// File: aiFlashcardService.ts
// Description: Smart AI service for automatic flashcard generation using DeepSeek V3.
// Provides intelligent question-answer generation with complexity detection.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../config/api';

export interface FlashcardData {
  question: string;
  answer: string;
}

export interface GenerationRequest {
  subject: string;
  topic: string;
  cardCount: number;
}

export interface GenerationResult {
  success: boolean;
  cards?: FlashcardData[];
  warning?: string;
  error?: string;
}

/**
 * AI-powered flashcard generation service that creates contextual Q&A pairs
 * @class AIFlashcardService
 */
class AIFlashcardService {
  
  // Knowledge domains that the AI can handle well
  private readonly SUPPORTED_DOMAINS = [
    'science', 'biology', 'chemistry', 'physics', 'mathematics', 'math',
    'history', 'geography', 'literature', 'language', 'computer science',
    'programming', 'psychology', 'sociology', 'philosophy', 'economics',
    'business', 'art', 'music', 'health', 'medicine', 'anatomy',
    'elementary', 'basic', 'fundamentals', 'introduction'
  ];

  // Complex topics that might be challenging for automated generation
  private readonly COMPLEX_INDICATORS = [
    'advanced', 'graduate', 'phd', 'research', 'quantum', 'theoretical',
    'differential', 'integral', 'abstract', 'methodology', 'analysis',
    'synthesis', 'critique', 'evaluation', 'meta', 'epistemology',
    'ontology', 'phenomenology', 'hermeneutics', 'postmodern',
    'neurosurgery', 'pharmacology', 'pathophysiology', 'biochemistry'
  ];

  // Question templates for different learning levels
  private readonly QUESTION_TEMPLATES = {
    definition: [
      "What is {topic}?",
      "Define {topic}.",
      "How would you explain {topic}?",
      "What does {topic} mean?",
      "Describe {topic} in simple terms."
    ],
    process: [
      "How does {topic} work?",
      "What are the steps involved in {topic}?",
      "Explain the process of {topic}.",
      "What happens during {topic}?",
      "Describe how {topic} functions."
    ],
    application: [
      "When is {topic} used?",
      "What are examples of {topic}?",
      "How is {topic} applied in real life?",
      "Where do we see {topic} in practice?",
      "What are the applications of {topic}?"
    ],
    comparison: [
      "How does {topic} differ from {alternative}?",
      "Compare {topic} and {alternative}.",
      "What distinguishes {topic} from {alternative}?",
      "What are the similarities and differences between {topic} and {alternative}?"
    ],
    analysis: [
      "Why is {topic} important?",
      "What are the causes of {topic}?",
      "What are the effects of {topic}?",
      "What factors influence {topic}?",
      "What are the components of {topic}?"
    ]
  };

  /**
   * Analyzes if a topic is suitable for AI generation
   * @param title - Set title
   * @param subject - Subject area
   * @param topics - List of topics to cover
   * @returns Object with suitability assessment
   */
  private assessComplexity(title: string, subject: string, topics: string[]): {
    isComplex: boolean;
    reason?: string;
    suggestion?: string;
  } {
    try {
      console.log('[AI Service] Assessing complexity for:', { title, subject, topics });
      
      const allText = `${title} ${subject} ${topics.join(' ')}`.toLowerCase();
      
      // Check for complex indicators
      const complexTerms = this.COMPLEX_INDICATORS.filter(term => 
        allText.includes(term.toLowerCase())
      );

      if (complexTerms.length > 0) {
        return {
          isComplex: true,
          reason: `Contains advanced terminology: ${complexTerms.join(', ')}`,
          suggestion: 'Consider breaking down into simpler concepts or creating manual flashcards for better accuracy.'
        };
      }

      // Check if subject is supported
      const isSupported = this.SUPPORTED_DOMAINS.some(domain => 
        allText.includes(domain.toLowerCase())
      );

      if (!isSupported) {
        return {
          isComplex: true,
          reason: 'Subject area not well-supported by AI generation',
          suggestion: 'Manual creation recommended for specialized topics. AI works best with common academic subjects.'
        };
      }

      // Check topic length and complexity
      const avgTopicLength = topics.reduce((sum, topic) => sum + topic.length, 0) / topics.length;
      if (avgTopicLength > 50) {
        return {
          isComplex: true,
          reason: 'Topics appear to be too detailed or complex',
          suggestion: 'Try shorter, more focused topic names (e.g., "Photosynthesis" instead of "Detailed photosynthetic pathways in C3 plants")'
        };
      }

      return { isComplex: false };
    } catch (error) {
      console.error('[AI Service] Error in complexity assessment:', error);
      return {
        isComplex: true,
        reason: 'Unable to assess complexity',
        suggestion: 'Please try manual creation or simplify your topics.'
      };
    }
  }

  /**
   * Generates contextual answers based on question type and topic
   * @param question - Generated question
   * @param topic - Topic being covered
   * @param subject - Subject area
   * @param title - Set title for context
   * @returns Generated answer
   */
  private generateContextualAnswer(
    question: string, 
    topic: string, 
    subject: string, 
    title: string
  ): string {
    try {
      const questionLower = question.toLowerCase();
      const topicClean = topic.trim();
      const subjectClean = subject.trim();
      
      // Answer patterns based on question type
      if (questionLower.includes('what is') || questionLower.includes('define')) {
        return `${topicClean} is a fundamental concept in ${subjectClean}. As part of "${title}", it refers to [the basic definition, key characteristics, and primary purpose]. Understanding ${topicClean} is essential because it forms the foundation for more advanced topics in this area.`;
      }
      
      if (questionLower.includes('how does') || questionLower.includes('process')) {
        return `The process of ${topicClean} in ${subjectClean} involves several key steps: 1) Initial phase/setup, 2) Main process/transformation, 3) Final outcome/result. Each step is important because it contributes to the overall understanding of how ${topicClean} functions within the broader context of "${title}".`;
      }
      
      if (questionLower.includes('when is') || questionLower.includes('examples')) {
        return `${topicClean} is commonly applied in several contexts within ${subjectClean}: 1) Primary use case with specific example, 2) Secondary application in related field, 3) Real-world example that students can relate to. These applications demonstrate why ${topicClean} is relevant to the study of "${title}".`;
      }
      
      if (questionLower.includes('why is') || questionLower.includes('important')) {
        return `${topicClean} is significant in ${subjectClean} for several reasons: 1) It provides foundational understanding for advanced concepts, 2) It has practical applications in real-world scenarios, 3) It connects to other important topics in "${title}". This importance makes it a crucial element for comprehensive learning.`;
      }
      
      if (questionLower.includes('compare') || questionLower.includes('differ')) {
        return `When comparing ${topicClean} with related concepts in ${subjectClean}, key differences include: 1) Structural/functional differences, 2) Different applications or contexts, 3) Varying levels of complexity or scope. Understanding these distinctions helps clarify the specific role of ${topicClean} within "${title}".`;
      }
      
      // Default comprehensive answer
      return `${topicClean} is an important concept in ${subjectClean} that students studying "${title}" should understand. It encompasses key principles, practical applications, and connections to related topics. To master ${topicClean}, focus on: 1) Core definition and characteristics, 2) How it works or applies, 3) Why it matters in the broader context.`;
      
    } catch (error) {
      console.error('[AI Service] Error generating answer:', error);
      return `${topic} is a key concept in ${subject}. Review the main points, examples, and applications related to this topic as part of your study of "${title}".`;
    }
  }

  /**
   * Selects appropriate question templates based on topic and iteration
   * @param topic - Topic to create question for
   * @param index - Current card index for variety
   * @param totalCards - Total number of cards being generated
   * @returns Selected question template category
   */
  private selectQuestionType(topic: string, index: number, totalCards: number): keyof typeof this.QUESTION_TEMPLATES {
    const types = Object.keys(this.QUESTION_TEMPLATES) as Array<keyof typeof this.QUESTION_TEMPLATES>;
    
    // Ensure variety across different question types
    if (totalCards <= 5) {
      // For small sets, focus on core types
      const coreTypes: Array<keyof typeof this.QUESTION_TEMPLATES> = ['definition', 'process', 'application'];
      return coreTypes[index % coreTypes.length];
    } else {
      // For larger sets, use all types for variety
      return types[index % types.length];
    }
  }

  /**
   * Creates related topics for comparison questions
   * @param mainTopic - Primary topic
   * @param allTopics - All topics in the set
   * @returns Related topic or generic alternative
   */
  private findRelatedTopic(mainTopic: string, allTopics: string[]): string {
    const otherTopics = allTopics.filter(t => t.toLowerCase() !== mainTopic.toLowerCase());
    if (otherTopics.length > 0) {
      return otherTopics[Math.floor(Math.random() * otherTopics.length)];
    }
    return 'related concepts';
  }

  /**
   * Main method to generate flashcards using DeepSeek V3 API
   * @param request - Generation request with subject, topic, and card count
   * @returns Promise with generation result
   */
  async generateFlashcards(request: GenerationRequest): Promise<GenerationResult> {
    try {
      console.log('[AI Service] Starting flashcard generation with DeepSeek V3:', request);
      
      const { subject, topic, cardCount } = request;

      // Validate input
      if (!subject?.trim() || !topic?.trim() || cardCount < 1) {
        return {
          success: false,
          error: 'Invalid input: Subject, topic, and card count are required.'
        };
      }

      // Get the actual auth token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      
      // Call backend API for DeepSeek V3 generation
      const response = await fetch(createApiUrl(API_ENDPOINTS.FLASHCARD_GENERATE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'test-token'}`
        },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          cardCount: Math.min(cardCount, 15)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Failed to generate flashcards'
        };
      }

      const result = await response.json();
      console.log('[AI Service] DeepSeek V3 generation result:', result);

      return result;

    } catch (error) {
      console.error('[AI Service] Error in flashcard generation:', error);
      return {
        success: false,
        error: 'Failed to generate flashcards. Please try again or use manual creation.'
      };
    }
  }

  /**
   * Validates if a topic is suitable for AI generation
   * @param topic - Topic to validate
   * @returns Validation result with suggestions
   */
  validateTopic(topic: string): { isValid: boolean; suggestion?: string } {
    if (!topic?.trim()) {
      return { isValid: false, suggestion: 'Topic cannot be empty.' };
    }

    const cleanTopic = topic.trim();
    
    if (cleanTopic.length < 2) {
      return { isValid: false, suggestion: 'Topic too short. Use at least 2 characters.' };
    }

    if (cleanTopic.length > 100) {
      return { isValid: false, suggestion: 'Topic too long. Keep it under 100 characters.' };
    }

    // Check for overly complex terminology
    const complexTerms = this.COMPLEX_INDICATORS.filter(term => 
      cleanTopic.toLowerCase().includes(term)
    );

    if (complexTerms.length > 0) {
      return { 
        isValid: false, 
        suggestion: `Topic appears complex (contains: ${complexTerms.join(', ')}). Consider simpler terms.` 
      };
    }

    return { isValid: true };
  }

  /**
   * Gets suggested topics based on subject
   * @param subject - Subject area
   * @returns Array of suggested topics
   */
  getSuggestedTopics(subject: string): string[] {
    const subjectLower = subject.toLowerCase();
    
    const suggestions: { [key: string]: string[] } = {
      science: ['Photosynthesis', 'Cell Division', 'Ecosystems', 'Chemical Reactions', 'States of Matter'],
      biology: ['DNA Structure', 'Cellular Respiration', 'Evolution', 'Genetics', 'Human Body Systems'],
      chemistry: ['Periodic Table', 'Chemical Bonds', 'Acids and Bases', 'Organic Compounds', 'Reactions'],
      physics: ['Newton\'s Laws', 'Energy', 'Waves', 'Electricity', 'Magnetism'],
      mathematics: ['Algebra Basics', 'Geometry', 'Fractions', 'Equations', 'Graphing'],
      history: ['World War I', 'Ancient Civilizations', 'Industrial Revolution', 'Cold War', 'Renaissance'],
      geography: ['Continents', 'Climate Zones', 'Mountain Ranges', 'Ocean Currents', 'Countries'],
      programming: ['Variables', 'Functions', 'Loops', 'Data Types', 'Algorithms']
    };

    // Find matching subject
    for (const [key, topics] of Object.entries(suggestions)) {
      if (subjectLower.includes(key)) {
        return topics;
      }
    }

    // Default suggestions
    return ['Basic Concepts', 'Key Terms', 'Main Ideas', 'Important Facts', 'Core Principles'];
  }
}

// Export singleton instance
export const aiFlashcardService = new AIFlashcardService();
