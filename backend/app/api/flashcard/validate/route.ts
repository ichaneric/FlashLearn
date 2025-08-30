// File: validate/route.ts
// Description: API endpoint for validating topics before AI generation

import { NextRequest, NextResponse } from 'next/server';

// CORS headers helper
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

/**
 * Simple topic validation service
 */
class TopicValidator {
  
  private readonly COMPLEX_INDICATORS = [
    'advanced', 'graduate', 'phd', 'research', 'quantum', 'theoretical',
    'differential', 'integral', 'abstract', 'methodology', 'analysis',
    'synthesis', 'critique', 'evaluation', 'meta', 'epistemology',
    'ontology', 'phenomenology', 'hermeneutics', 'postmodern',
    'neurosurgery', 'pharmacology', 'pathophysiology', 'biochemistry'
  ];

  private readonly SUPPORTED_DOMAINS = [
    'science', 'biology', 'chemistry', 'physics', 'mathematics', 'math',
    'history', 'geography', 'literature', 'language', 'computer science',
    'programming', 'psychology', 'sociology', 'philosophy', 'economics',
    'business', 'art', 'music', 'health', 'medicine', 'anatomy',
    'elementary', 'basic', 'fundamentals', 'introduction'
  ];

  /**
   * Validates a single topic
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
   * Suggests topics based on subject
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

    for (const [key, topics] of Object.entries(suggestions)) {
      if (subjectLower.includes(key)) {
        return topics;
      }
    }

    return ['Basic Concepts', 'Key Terms', 'Main Ideas', 'Important Facts', 'Core Principles'];
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

// GET endpoint for topic suggestions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    if (!subject) {
      const response = NextResponse.json({ 
        error: 'Subject parameter is required' 
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    const validator = new TopicValidator();
    const suggestions = validator.getSuggestedTopics(subject);

    const response = NextResponse.json({ 
      suggestions,
      subject: subject.trim()
    });
    return addCorsHeaders(response);

  } catch (error: any) {
    const response = NextResponse.json({ 
      error: 'Failed to get topic suggestions' 
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}

// POST endpoint for topic validation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topics } = body;

    if (!Array.isArray(topics)) {
      const response = NextResponse.json({ 
        error: 'Topics must be an array' 
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    const validator = new TopicValidator();
    const results = topics.map((topic: string) => ({
      topic: topic,
      ...validator.validateTopic(topic)
    }));

    const response = NextResponse.json({ 
      validationResults: results,
      overallValid: results.every(r => r.isValid)
    });
    return addCorsHeaders(response);

  } catch (error: any) {
    const response = NextResponse.json({ 
      error: 'Failed to validate topics' 
    }, { status: 500 });
    return addCorsHeaders(response);
  }
}
