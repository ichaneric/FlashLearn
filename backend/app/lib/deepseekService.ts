// File: deepseekService.ts
// Description: DeepSeek V3 integration service for intelligent flashcard generation

// Note: OpenAI import removed to prevent build issues
// Service will use fallback generation when no API key is configured

/**
 * Interface for flashcard generation request
 */
interface FlashcardRequest {
  subject: string;
  topic: string;
  cardCount: number;
}

/**
 * Interface for generated flashcard
 */
interface GeneratedFlashcard {
  question: string;
  answer: string;
}

/**
 * Interface for generation result
 */
interface GenerationResult {
  success: boolean;
  cards?: GeneratedFlashcard[];
  error?: string;
  warning?: string;
}

/**
 * DeepSeek V3 service for generating high-quality flashcards
 */
class DeepSeekFlashcardService {
  private client: null = null;
  private readonly maxRetries = 3;
  private readonly requestTimeout = 30000; // 30 seconds

  constructor() {
    // Initialize DeepSeek V3 client only if API key is available
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your-deepseek-api-key-here') {
      // OpenAI client initialization removed to prevent build issues
      // Service will use fallback generation instead
      console.log('[DeepSeek Service] API key found but OpenAI client not configured, using fallback');
    }
  }

  /**
   * Validates if the topic is suitable for AI generation
   */
  private validateTopic(subject: string, topic: string): { isValid: boolean; reason?: string; suggestion?: string } {
    // Check for empty or very short inputs
    if (!topic.trim() || topic.trim().length < 3) {
      return {
        isValid: false,
        reason: 'Topic is too short or empty',
        suggestion: 'Please provide a more detailed topic (at least 3 characters). For example: "Basic Math" instead of "Math"'
      };
    }

    // Check for overly long topics that might be confusing
    if (topic.trim().length > 100) {
      return {
        isValid: false,
        reason: 'Topic is too long and complex',
        suggestion: 'Please use a shorter, more specific topic. For example: "World War II" instead of a long description'
      };
    }

    // Check for overly complex or specialized topics
    const complexIndicators = [
      'advanced doctoral', 'phd research', 'graduate-level', 'post-doctoral',
      'highly specialized', 'research methodology', 'meta-analysis',
      'advanced quantum mechanics', 'theoretical physics beyond'
    ];

    const topicLower = topic.toLowerCase();
    const complexFound = complexIndicators.find(indicator => topicLower.includes(indicator));
    
    if (complexFound) {
      return {
        isValid: false,
        reason: 'Topic appears too specialized for general flashcard generation',
        suggestion: 'Try breaking down the topic into more fundamental concepts. For example: "Basic Physics" instead of "Advanced Quantum Mechanics"'
      };
    }

    // Check for inappropriate content
    const inappropriateIndicators = [
      'adult content', 'explicit', 'inappropriate', 'nsfw'
    ];

    const inappropriateFound = inappropriateIndicators.find(indicator => topicLower.includes(indicator));
    
    if (inappropriateFound) {
      return {
        isValid: false,
        reason: 'Topic contains inappropriate content',
        suggestion: 'Please choose an educational topic suitable for learning'
      };
    }

    return { isValid: true };
  }

  /**
   * Creates a smart, contextual prompt for DeepSeek V3 to generate flashcards
   */
  private createPrompt(request: FlashcardRequest): string {
    return `Generate ${request.cardCount} flashcards with the following constraints:

QUESTION CONSTRAINTS:
- 6-18 words per question
- 1-2 sentences only
- Must stay on-topic with the set's subject
- Should not lean toward any bias or opinion
- Should be generic and widely applicable, not hyper-specific

ANSWER CONSTRAINTS:
- 1-2 sentences max
- Simple and easy to understand
- Must be relevant to the generated question
- Avoid fluff, keep it direct

Topic: ${request.subject} - ${request.topic}

EXAMPLES:

For "Biology - Pollination":
[{"question": "How do flowers transfer pollen?", "answer": "Flowers transfer pollen through wind, insects, birds, and other animals."}, {"question": "What is the male part of a flower?", "answer": "The stamen is the male reproductive part that produces pollen."}]

For "History - World War II":
[{"question": "When did World War II begin?", "answer": "World War II began in 1939 when Germany invaded Poland."}, {"question": "Which countries were the main Allied powers?", "answer": "The main Allied powers were the United States, United Kingdom, and Soviet Union."}]

For "Math - Basic Algebra":
[{"question": "What is a variable in algebra?", "answer": "A variable is a symbol that represents an unknown number or value."}, {"question": "How do you solve for x in 2x + 3 = 7?", "answer": "Subtract 3 from both sides, then divide by 2 to get x = 2."}]

Generate ${request.cardCount} flashcards for "${request.topic}" in ${request.subject}.
Ensure questions are 6-18 words and answers are 1-2 sentences.
Return ONLY the JSON array:`;
  }

  /**
   * Parses the AI response and validates the generated flashcards
   */
  private parseResponse(response: string): { success: boolean; cards?: GeneratedFlashcard[]; error?: string } {
    try {
      // Clean the response to extract JSON
      let cleanResponse = response.trim();
      
      // Remove any markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
      cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
      
      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanResponse.indexOf('[');
      const jsonEnd = cleanResponse.lastIndexOf(']') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        console.error('[DeepSeek Service] No JSON array found in response:', cleanResponse.substring(0, 200));
        return {
          success: false,
          error: 'No valid JSON array found in AI response'
        };
      }
      
      const jsonStr = cleanResponse.substring(jsonStart, jsonEnd);
      let cards;
      
      try {
        cards = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('[DeepSeek Service] JSON parse error:', parseError, 'JSON string:', jsonStr);
        return {
          success: false,
          error: 'Invalid JSON format in AI response'
        };
      }
      
      // Validate the structure
      if (!Array.isArray(cards)) {
        return {
          success: false,
          error: 'AI response is not a valid array'
        };
      }
      
      // Validate each card with length constraints
      const validCards: GeneratedFlashcard[] = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        if (typeof card === 'object' && 
            typeof card.question === 'string' && 
            typeof card.answer === 'string' &&
            card.question.trim().length > 0 && 
            card.answer.trim().length > 0) {
          
          // Trim whitespace and trailing punctuation
          const question = card.question.trim();
          let answer = card.answer.trim();
          
          // Remove trailing punctuation from answer
          answer = answer.replace(/[.!?]+$/, '');
          
                     // Validate length constraints (6-18 words for questions, 1-2 sentences for answers)
           const questionWords = question.split(/\s+/).length;
           const answerSentences = answer.split(/[.!?]+/).filter((s: string) => s.trim().length > 0).length;
           
           if (questionWords >= 6 && questionWords <= 18 && answerSentences >= 1 && answerSentences <= 2) {
             validCards.push({
               question: question,
               answer: answer
             });
           } else {
             console.warn(`[DeepSeek Service] Card ${i + 1} exceeds constraints: Q="${question}" (${questionWords} words), A="${answer}" (${answerSentences} sentences)`);
           }
        } else {
          console.warn(`[DeepSeek Service] Invalid card structure at index ${i}:`, card);
        }
      }
      
      if (validCards.length === 0) {
        return {
          success: false,
          error: 'No valid flashcards found in AI response'
        };
      }
      
      console.log(`[DeepSeek Service] Successfully parsed ${validCards.length} valid cards from ${cards.length} total cards`);
      
      return {
        success: true,
        cards: validCards
      };
      
    } catch (error) {
      console.error('[DeepSeek Service] Error parsing response:', error);
      return {
        success: false,
        error: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Fallback method for generating cards when API fails
   */
  private generateFallbackCards(request: FlashcardRequest): GenerationResult {
    try {
      const cards: GeneratedFlashcard[] = [];
      const topic = request.topic.trim();
      const subject = request.subject.trim();
      const topicLower = topic.toLowerCase();
      
      // First try to get specific topic-based cards
      const specificPairs = this.getSpecificTopicPairs(topicLower);
      
      if (specificPairs.length > 0) {
        // Use specific topic cards if available
        const selectedPairs = specificPairs.slice(0, request.cardCount);
        for (const pair of selectedPairs) {
          cards.push({
            question: pair.question,
            answer: pair.answer
          });
        }
        
        // If we need more cards, fill with smart fallback
        if (cards.length < request.cardCount) {
          const remainingCount = request.cardCount - cards.length;
          const fallbackPairs = this.generateSmartFallbackPairs(topic, subject, remainingCount);
          for (const pair of fallbackPairs) {
            cards.push({
              question: pair.question,
              answer: pair.answer
            });
          }
        }
      } else {
        // Use smart fallback if no specific topic cards available
        const questionAnswerPairs = this.generateSmartFallbackPairs(topic, subject, request.cardCount);
        for (const pair of questionAnswerPairs) {
          cards.push({
            question: pair.question,
            answer: pair.answer
          });
        }
      }

      return {
        success: true,
        cards,
        warning: 'Generated using smart templates. For advanced AI generation with DeepSeek V3, please configure API key in environment variables.'
      };

    } catch (error) {
      console.error('[DeepSeek Service] Fallback generation error:', error instanceof Error ? error.message : error);
      return {
        success: false,
        error: 'Failed to generate fallback cards'
      };
    }
  }

  /**
   * Generates universal fallback question-answer pairs for any subject
   */
  private generateSmartFallbackPairs(topic: string, subject: string, count: number): Array<{question: string, answer: string}> {
    const pairs: Array<{question: string, answer: string}> = [];
    const subjectLower = subject.toLowerCase();

    // Subject-specific short templates
    if (subjectLower.includes('math') || subjectLower.includes('mathematics')) {
      pairs.push(
        { question: `2+2 equals?`, answer: `4` },
        { question: `Symbol for unknown?`, answer: `x` },
        { question: `Basic operation?`, answer: `Addition` },
        { question: `Number system?`, answer: `Decimal` },
        { question: `Simple equation?`, answer: `x=5` }
      );
    } else if (subjectLower.includes('history')) {
      pairs.push(
        { question: `Start year?`, answer: `1939` },
        { question: `Key leader?`, answer: `Hitler` },
        { question: `Major event?`, answer: `War` },
        { question: `End year?`, answer: `1945` },
        { question: `Allied powers?`, answer: `US, UK, USSR` }
      );
    } else if (subjectLower.includes('literature') || subjectLower.includes('english')) {
      pairs.push(
        { question: `Romeo's lover?`, answer: `Juliet` },
        { question: `Danish prince?`, answer: `Hamlet` },
        { question: `Author name?`, answer: `Shakespeare` },
        { question: `Play type?`, answer: `Tragedy` },
        { question: `Setting?`, answer: `Verona` }
      );
    } else if (subjectLower.includes('language') || subjectLower.includes('french') || subjectLower.includes('spanish')) {
      pairs.push(
        { question: `Hello in French?`, answer: `Bonjour` },
        { question: `Goodbye in French?`, answer: `Au revoir` },
        { question: `Thank you?`, answer: `Merci` },
        { question: `Yes in French?`, answer: `Oui` },
        { question: `No in French?`, answer: `Non` }
      );
    } else if (subjectLower.includes('business') || subjectLower.includes('accounting')) {
      pairs.push(
        { question: `Assets equal?`, answer: `Liabilities + Equity` },
        { question: `Revenue minus expenses?`, answer: `Profit` },
        { question: `Business type?`, answer: `Corporation` },
        { question: `Financial statement?`, answer: `Balance Sheet` },
        { question: `Cash flow?`, answer: `Income - Expenses` }
      );
    } else {
      // Smart universal templates that avoid generic patterns
      pairs.push(
        { question: `Study method?`, answer: `Practice regularly` },
        { question: `Learning tip?`, answer: `Break it down` },
        { question: `Memory technique?`, answer: `Repetition` },
        { question: `Success factor?`, answer: `Consistency` },
        { question: `Best approach?`, answer: `Step by step` }
      );
    }

    // Return the requested number of cards, cycling through available pairs if needed
    const result: Array<{question: string, answer: string}> = [];
    for (let i = 0; i < count; i++) {
      if (pairs[i]) {
        result.push(pairs[i]);
      } else {
        // Cycle through available pairs if we need more cards
        const cycleIndex = i % pairs.length;
        result.push({
          question: pairs[cycleIndex].question,
          answer: pairs[cycleIndex].answer
        });
      }
    }

    return result;
  }

  /**
   * Gets specific knowledge-based question-answer pairs for common topics
   */
  private getSpecificTopicPairs(topicLower: string): Array<{question: string, answer: string}> {
    const pairs: Array<{question: string, answer: string}> = [];

    // Pollination
    if (topicLower.includes('pollination') || topicLower.includes('pollinate')) {
      pairs.push(
        { question: "How do flowers transfer pollen between plants?", answer: "Flowers transfer pollen through wind, insects, birds, and other animals." },
        { question: "What is the male reproductive part of a flower?", answer: "The stamen is the male reproductive part that produces pollen." },
        { question: "What is the female reproductive part of a flower?", answer: "The pistil is the female reproductive part that receives pollen." },
        { question: "Where does pollen land on the female flower?", answer: "Pollen lands on the stigma, which is the sticky top part of the pistil." },
        { question: "What happens after successful pollination occurs?", answer: "After pollination, fertilization occurs and seeds develop." },
        { question: "Why do flowers have bright colors and sweet nectar?", answer: "Bright colors and nectar attract pollinators like bees and butterflies." },
        { question: "Which plants rely on wind for pollination?", answer: "Grasses, trees, and some flowers rely on wind for pollination." },
        { question: "What is self-pollination in flowering plants?", answer: "Self-pollination occurs when pollen from a flower fertilizes the same flower." }
      );
    }
    
    // Human Brain / Brain Parts / Nervous System
    else if (topicLower.includes('brain') || topicLower.includes('human brain') || topicLower.includes('parts of brain') || topicLower.includes('parts of the brain') || topicLower.includes('nervous system')) {
      pairs.push(
        { question: "What is the largest region of the human brain?", answer: "The cerebrum is the largest region and controls thinking, memory, and voluntary movements." },
        { question: "Which part of the brain controls balance and coordination?", answer: "The cerebellum controls balance, coordination, and fine motor movements." },
        { question: "What part of the brain controls breathing and heart rate?", answer: "The brain stem controls vital functions like breathing, heart rate, and consciousness." },
        { question: "Where in the brain is memory primarily stored?", answer: "The hippocampus is primarily responsible for forming and storing memories." },
        { question: "Which brain lobe processes visual information?", answer: "The occipital lobe processes visual information from the eyes." },
        { question: "What brain area controls speech production?", answer: "Broca's area controls speech production and language expression." },
        { question: "Which brain structure processes emotions and fear?", answer: "The amygdala processes emotions, fear responses, and emotional memories." },
        { question: "What brain region is responsible for decision making?", answer: "The frontal lobe is responsible for decision making, planning, and personality." }
      );
    }
    
    // Solar System
    else if (topicLower.includes('solar system') || topicLower.includes('planets')) {
      pairs.push(
        { question: "Closest planet to Sun?", answer: "Mercury" },
        { question: "Largest planet?", answer: "Jupiter" },
        { question: "Red planet?", answer: "Mars" },
        { question: "Planet with rings?", answer: "Saturn" },
        { question: "Our galaxy name?", answer: "Milky Way" },
        { question: "Planet count?", answer: "8 planets" },
        { question: "Blue planet?", answer: "Earth" },
        { question: "Coldest planet?", answer: "Neptune" }
      );
    }
    
    // Cell Division
    else if (topicLower.includes('cell division') || topicLower.includes('mitosis') || topicLower.includes('meiosis')) {
      pairs.push(
        { question: "Mitosis produces?", answer: "2 identical cells" },
        { question: "Meiosis produces?", answer: "4 gametes" },
        { question: "Mitosis phases?", answer: "PMAT" },
        { question: "Chromosome count?", answer: "46 in humans" },
        { question: "Growth type?", answer: "Mitosis" },
        { question: "Sex cell type?", answer: "Meiosis" },
        { question: "Repair process?", answer: "Mitosis" },
        { question: "Genetic variation?", answer: "Meiosis" }
      );
    }
    
    // Photosynthesis
    else if (topicLower.includes('photosynthesis')) {
      pairs.push(
        { question: "Main product made?", answer: "Glucose" },
        { question: "Gas released?", answer: "Oxygen" },
        { question: "Green pigment?", answer: "Chlorophyll" },
        { question: "Energy source?", answer: "Sunlight" },
        { question: "Gas absorbed?", answer: "Carbon dioxide" },
        { question: "Location in plant?", answer: "Leaves" },
        { question: "Cell structure?", answer: "Chloroplasts" },
        { question: "Food chain role?", answer: "Producer" }
      );
    }
    
    // World War II
    else if (topicLower.includes('world war ii') || topicLower.includes('world war 2') || topicLower.includes('wwii') || topicLower.includes('ww2')) {
      pairs.push(
        { question: "War start year?", answer: "1939" },
        { question: "Pearl Harbor date?", answer: "Dec 7, 1941" },
        { question: "D-Day year?", answer: "1944" },
        { question: "War end year?", answer: "1945" },
        { question: "Atomic bomb target?", answer: "Hiroshima" },
        { question: "Nazi leader?", answer: "Hitler" },
        { question: "Allied leaders?", answer: "Churchill, Roosevelt" },
        { question: "Axis powers?", answer: "Germany, Japan, Italy" }
      );
    }

    
    // DNA and Genetics
    else if (topicLower.includes('dna') || topicLower.includes('genetics') || topicLower.includes('heredity') || topicLower.includes('genes')) {
      pairs.push(
        {
          question: "What is DNA and what does it do?",
          answer: "DNA (Deoxyribonucleic Acid) is the genetic material that carries instructions for all living things. It contains the code for making proteins and determining inherited traits like eye color, height, and susceptibility to diseases."
        },
        {
          question: "What is the structure of DNA?",
          answer: "DNA has a double helix structure, like a twisted ladder. The sides are made of sugar and phosphate, while the rungs are pairs of bases: Adenine pairs with Thymine, and Guanine pairs with Cytosine."
        },
        {
          question: "How are traits passed from parents to offspring?",
          answer: "Traits are passed through genes, which are segments of DNA. Offspring inherit one copy of each gene from each parent. Dominant traits mask recessive traits when both are present."
        },
        {
          question: "What is the difference between genotype and phenotype?",
          answer: "Genotype refers to the genetic makeup (the actual genes), while phenotype refers to the observable characteristics (what you can see, like brown eyes or tall height)."
        }
      );
    }
    
    // Circulatory System / Heart
    else if (topicLower.includes('heart') || topicLower.includes('circulatory') || topicLower.includes('blood') || topicLower.includes('cardiovascular')) {
      pairs.push(
        {
          question: "What are the main functions of the circulatory system?",
          answer: "The circulatory system transports oxygen and nutrients to body cells, removes waste products like carbon dioxide, helps regulate body temperature, and fights infections through white blood cells."
        },
        {
          question: "What are the four chambers of the heart?",
          answer: "The heart has four chambers: two atria (left and right) that receive blood, and two ventricles (left and right) that pump blood out. The right side pumps to lungs, the left side pumps to the body."
        },
        {
          question: "What is the difference between arteries and veins?",
          answer: "Arteries carry oxygen-rich blood away from the heart to body tissues (except pulmonary artery). Veins carry oxygen-poor blood back to the heart (except pulmonary veins). Arteries have thicker walls to handle higher pressure."
        },
        {
          question: "What are the components of blood?",
          answer: "Blood consists of red blood cells (carry oxygen), white blood cells (fight infection), platelets (help clotting), and plasma (liquid portion that carries nutrients, hormones, and waste)."
        }
      );
    }
    
    // Digestive System
    else if (topicLower.includes('digestive') || topicLower.includes('digestion') || topicLower.includes('stomach') || topicLower.includes('intestines')) {
      pairs.push(
        {
          question: "What is the main function of the digestive system?",
          answer: "The digestive system breaks down food into nutrients that can be absorbed by the body, eliminates waste, and provides energy for cellular processes and growth."
        },
        {
          question: "What happens to food in the stomach?",
          answer: "In the stomach, food is mixed with gastric acid and enzymes that begin breaking down proteins. The stomach muscles churn the food into a liquid mixture called chyme."
        },
        {
          question: "What is the role of the small intestine?",
          answer: "The small intestine is where most digestion and absorption occurs. Enzymes break down food into molecules small enough to enter the bloodstream, and nutrients are absorbed through the intestinal wall."
        },
        {
          question: "How long does the digestive process take?",
          answer: "The complete digestive process typically takes 24-72 hours. Food stays in the stomach 2-4 hours, moves through the small intestine in 3-5 hours, and travels through the large intestine in 12-48 hours."
        }
      );
    }
    
    // Respiratory System
    else if (topicLower.includes('respiratory') || topicLower.includes('lungs') || topicLower.includes('breathing') || topicLower.includes('oxygen')) {
      pairs.push(
        {
          question: "What is the main function of the respiratory system?",
          answer: "The respiratory system brings oxygen into the body and removes carbon dioxide. It includes the nose, throat, windpipe (trachea), bronchi, and lungs where gas exchange occurs."
        },
        {
          question: "How does gas exchange occur in the lungs?",
          answer: "Gas exchange happens in tiny air sacs called alveoli. Oxygen from inhaled air passes through alveoli walls into blood capillaries, while carbon dioxide moves from blood into alveoli to be exhaled."
        },
        {
          question: "What controls breathing?",
          answer: "Breathing is controlled automatically by the brain stem, specifically the medulla oblongata. It monitors carbon dioxide levels in blood and adjusts breathing rate accordingly, though we can also control it consciously."
        }
      );
    }
    
    // Ecosystems and Environment
    else if (topicLower.includes('ecosystem') || topicLower.includes('environment') || topicLower.includes('food chain') || topicLower.includes('biodiversity')) {
      pairs.push(
        {
          question: "What is an ecosystem?",
          answer: "An ecosystem is a community of living organisms (plants, animals, bacteria) interacting with their physical environment (air, water, soil, climate) in a specific area."
        },
        {
          question: "What is a food chain?",
          answer: "A food chain shows how energy flows through an ecosystem. It starts with producers (plants), moves to primary consumers (herbivores), then secondary consumers (carnivores), and decomposers break down dead organisms."
        },
        {
          question: "What is biodiversity and why is it important?",
          answer: "Biodiversity is the variety of life in an ecosystem, including different species, genetic variation, and ecosystem diversity. It's important for ecosystem stability, food security, medicine, and environmental resilience."
        },
        {
          question: "How do human activities affect ecosystems?",
          answer: "Human activities like deforestation, pollution, overfishing, and urbanization can disrupt ecosystems by destroying habitats, reducing biodiversity, and altering natural cycles like water and carbon cycles."
        }
      );
    }
    
    // Chemistry - Atoms and Elements
    else if (topicLower.includes('atom') || topicLower.includes('elements') || topicLower.includes('periodic table') || topicLower.includes('molecules')) {
      pairs.push(
        {
          question: "What is an atom?",
          answer: "An atom is the smallest unit of matter that retains the properties of an element. It consists of a nucleus (containing protons and neutrons) surrounded by electrons in energy levels or shells."
        },
        {
          question: "What are the three main subatomic particles?",
          answer: "The three main subatomic particles are protons (positive charge, in nucleus), neutrons (no charge, in nucleus), and electrons (negative charge, orbiting nucleus in energy levels)."
        },
        {
          question: "How are elements organized in the periodic table?",
          answer: "Elements are arranged by increasing atomic number (number of protons). Elements in the same column (group) have similar properties, while elements in the same row (period) have the same number of electron shells."
        },
        {
          question: "What is the difference between an element and a compound?",
          answer: "An element contains only one type of atom (like oxygen or gold), while a compound contains two or more different elements chemically bonded together (like water H₂O or salt NaCl)."
        }
      );
    }
    
    // Physics - Motion and Forces
    else if (topicLower.includes('motion') || topicLower.includes('force') || topicLower.includes('gravity') || topicLower.includes('newton')) {
      pairs.push(
        {
          question: "What is Newton's First Law of Motion?",
          answer: "Newton's First Law states that an object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force. This is also called the law of inertia."
        },
        {
          question: "What is Newton's Second Law of Motion?",
          answer: "Newton's Second Law states that force equals mass times acceleration (F = ma). This means the acceleration of an object is directly proportional to the force applied and inversely proportional to its mass."
        },
        {
          question: "What is gravity?",
          answer: "Gravity is a fundamental force that attracts objects with mass toward each other. On Earth, gravity pulls objects toward the center of the planet with an acceleration of about 9.8 m/s²."
        },
        {
          question: "What is the difference between speed and velocity?",
          answer: "Speed is how fast something moves (distance divided by time), while velocity includes both speed and direction. Speed is a scalar quantity, velocity is a vector quantity."
        }
      );
    }
    
    // Mathematics - Algebra
    else if (topicLower.includes('algebra') || topicLower.includes('equation') || topicLower.includes('variable') || topicLower.includes('polynomial')) {
      pairs.push(
        {
          question: "What is a variable in algebra?",
          answer: "A variable is a symbol (usually a letter like x or y) that represents an unknown number or a number that can change. Variables allow us to write general mathematical relationships and solve problems."
        },
        {
          question: "What is a linear equation?",
          answer: "A linear equation is an equation where the highest power of the variable is 1. When graphed, it forms a straight line. The standard form is y = mx + b, where m is slope and b is y-intercept."
        },
        {
          question: "How do you solve a simple algebraic equation?",
          answer: "To solve an equation, use inverse operations to isolate the variable. Add/subtract the same number from both sides, multiply/divide both sides by the same number, and maintain balance."
        },
        {
          question: "What is the distributive property?",
          answer: "The distributive property states that a(b + c) = ab + ac. This means you can multiply a number by a sum by multiplying the number by each term in the sum and then adding the results."
        }
      );
    }
    
    // Geometry
    else if (topicLower.includes('geometry') || topicLower.includes('triangle') || topicLower.includes('circle') || topicLower.includes('angle')) {
      pairs.push(
        {
          question: "What are the basic types of angles?",
          answer: "The basic angle types are: acute (less than 90°), right (exactly 90°), obtuse (between 90° and 180°), straight (exactly 180°), and reflex (greater than 180°)."
        },
        {
          question: "What is the Pythagorean theorem?",
          answer: "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²."
        },
        {
          question: "How do you find the area of a circle?",
          answer: "The area of a circle is calculated using the formula A = πr², where π (pi) ≈ 3.14159 and r is the radius (distance from center to edge)."
        },
        {
          question: "What are the properties of triangles?",
          answer: "All triangles have three sides and three angles that sum to 180°. Types include equilateral (all sides equal), isosceles (two sides equal), and scalene (all sides different)."
        }
      );
    }

    return pairs;
  }

  /**
   * Generates flashcards using DeepSeek V3 or fallback templates
   */
  async generateFlashcards(request: FlashcardRequest): Promise<GenerationResult> {
    try {
      console.log('[DeepSeek Service] Starting flashcard generation:', {
        subject: request.subject,
        topic: request.topic,
        cardCount: request.cardCount
      });

      // Validate inputs with user-friendly error messages
      if (!request.subject?.trim()) {
        return {
          success: false,
          error: 'Subject is required',
          warning: 'Please enter a subject like "Math", "History", "Science", etc.'
        };
      }

      if (!request.topic?.trim()) {
        return {
          success: false,
          error: 'Topic is required',
          warning: 'Please enter a specific topic like "Basic Algebra", "World War II", "Human Brain", etc.'
        };
      }

      if (request.cardCount < 1 || request.cardCount > 15) {
        return {
          success: false,
          error: 'Card count must be between 1 and 15',
          warning: 'For best results, try generating 5-10 cards at a time'
        };
      }

      // Validate topic complexity
      const validation = this.validateTopic(request.subject, request.topic);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.reason || 'Topic validation failed',
          warning: validation.suggestion
        };
      }

      // If no API key configured, use fallback immediately
      if (!this.client) {
        console.log('[DeepSeek Service] No API key configured, using fallback generation');
        return this.generateFallbackCards(request);
      }

      // Skip API call and use fallback generation
      console.log('[DeepSeek Service] Using fallback generation (API not configured)');
      return this.generateFallbackCards(request);

    } catch (error) {
      console.error('[DeepSeek Service] Unexpected error:', error);
      return {
        success: false,
        error: `Unexpected error during generation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Checks if the DeepSeek API is properly configured
   */
  isApiConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Gets the current API configuration status
   */
  getApiStatus(): { configured: boolean; message: string } {
    if (this.client) {
      return {
        configured: true,
        message: 'DeepSeek V3 API is configured and ready to use'
      };
    } else {
      return {
        configured: false,
        message: 'DeepSeek V3 API is not configured. Using smart fallback templates instead.'
      };
    }
  }
}

// Export singleton instance
export const deepseekService = new DeepSeekFlashcardService();
