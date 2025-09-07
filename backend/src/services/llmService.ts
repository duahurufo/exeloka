import axios from 'axios';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

interface LLMResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AnalysisRequest {
  content: string;
  context?: string;
  analysisType: 'cultural_analysis' | 'recommendation_generation' | 'content_extraction' | 'feedback_analysis';
}

interface CulturalAnalysis {
  cultural_elements: string[];
  importance_level: 'high' | 'medium' | 'low';
  cultural_context: string;
  recommendations: string[];
  potential_risks: string[];
  traditional_practices: string[];
}

interface RecommendationAnalysis {
  executive_summary: string;
  strategic_approach: string[];
  detailed_methods: string[];
  risk_mitigation: string[];
  timeline_recommendations: string;
  success_metrics: string[];
  cultural_considerations: string[];
  confidence_score: number;
}

class LLMService {
  private apiKey?: string;
  private baseUrl: string;
  private defaultModel: string;
  private isAvailable: boolean;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.defaultModel = 'anthropic/claude-3-sonnet'; // Default model
    this.isAvailable = !!this.apiKey;
    
    if (!this.apiKey) {
      logger.warn('OpenRouter API key not provided. Enhanced Analysis will not be available.');
    }
  }

  async generateCompletion(
    messages: Array<{role: string; content: string}>,
    model: string = this.defaultModel,
    maxTokens: number = 1000
  ): Promise<LLMResponse> {
    if (!this.isAvailable) {
      throw createError('Enhanced Analysis not available. OpenRouter API key not configured.', 503);
    }
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'Exeloka - Cultural Wisdom System'
          },
          timeout: 60000 // 60 seconds timeout
        }
      );

      logger.info('LLM completion generated', {
        model,
        tokens: response.data.usage?.total_tokens || 'unknown'
      });

      return response.data;
    } catch (error: any) {
      logger.error('LLM completion failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        throw createError('Invalid OpenRouter API key', 500);
      } else if (error.response?.status === 429) {
        throw createError('Rate limit exceeded. Please try again later.', 429);
      } else if (error.code === 'ECONNABORTED') {
        throw createError('Request timeout. Please try again.', 408);
      }

      throw createError('LLM service unavailable', 503);
    }
  }

  async analyzeCulturalContent(content: string, sourceType: string = 'general'): Promise<CulturalAnalysis> {
    if (!this.isAvailable) {
      // Fallback to simple analysis when API is not available
      logger.info('Using fallback cultural analysis (API not available)');
      
      return this.simpleAnalyzeCulturalContent(content, sourceType);
    }

    const systemPrompt = `You are an expert anthropologist specializing in Javanese culture, particularly the Sampang region of East Java, Indonesia. 

Your task is to analyze content and extract cultural wisdom, traditional practices, and local knowledge that would be relevant for companies wanting to engage respectfully with the Sampang community.

Focus on:
1. Traditional customs (adat istiadat)
2. Local beliefs and spiritual practices
3. Community social structures
4. Economic practices and preferences
5. Communication styles and etiquette
6. Environmental knowledge and practices
7. Historical context and significance

Provide your analysis in valid JSON format with these fields:
- cultural_elements: array of identified cultural elements
- importance_level: "high", "medium", or "low"
- cultural_context: detailed explanation of cultural context
- recommendations: array of actionable recommendations for companies
- potential_risks: array of cultural sensitivities or risks to avoid
- traditional_practices: array of specific traditional practices mentioned

Be respectful and accurate. If uncertain about cultural details, indicate this clearly.`;

    const userPrompt = `Please analyze the following content for cultural wisdom and traditional practices related to Sampang, East Java:

Content Type: ${sourceType}
Content: ${content}

Extract and analyze any cultural elements, traditional practices, or local wisdom that could help companies engage more respectfully and successfully with the Sampang community.`;

    try {
      const response = await this.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], this.defaultModel, 2000);

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Validate the response structure
      if (!analysis.cultural_elements || !analysis.importance_level || !analysis.cultural_context) {
        throw new Error('Invalid analysis response structure');
      }

      return analysis;
    } catch (error: any) {
      if (error.name === 'SyntaxError') {
        logger.error('Failed to parse LLM cultural analysis response', { error: error.message });
        throw createError('Failed to process cultural analysis', 500);
      }
      throw error;
    }
  }

  async generateRecommendations(
    projectDescription: string,
    projectType: string,
    culturalContext: string,
    existingWisdom: string[]
  ): Promise<RecommendationAnalysis> {
    const systemPrompt = `You are a cultural consultant and business strategist specializing in helping companies engage successfully with local communities in Sampang, East Java, Indonesia.

Your expertise includes:
- Javanese cultural norms and values
- Sampang-specific traditions and practices  
- Community engagement strategies
- Risk assessment for cultural sensitivity
- Business-community relationship building

Generate comprehensive, actionable recommendations that will maximize the chances of community acceptance and project success while respecting local wisdom and traditions.

Provide your analysis in valid JSON format with these fields:
- executive_summary: brief overview of recommended approach
- strategic_approach: array of high-level strategic recommendations
- detailed_methods: array of specific tactical methods and actions
- risk_mitigation: array of strategies to mitigate cultural and social risks
- timeline_recommendations: string describing recommended timeline and phases
- success_metrics: array of measurable success indicators
- cultural_considerations: array of specific cultural factors to consider
- confidence_score: number between 0 and 1 representing confidence in recommendations`;

    const userPrompt = `Generate recommendations for the following project:

Project Type: ${projectType}
Project Description: ${projectDescription}

Cultural Context: ${culturalContext}

Available Cultural Wisdom:
${existingWisdom.map((wisdom, index) => `${index + 1}. ${wisdom}`).join('\n')}

Please provide comprehensive recommendations that will help this company engage successfully with the Sampang community while respecting local culture and traditions.`;

    try {
      const response = await this.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], this.defaultModel, 3000);

      const recommendations = JSON.parse(response.choices[0].message.content);
      
      // Validate the response structure
      if (!recommendations.executive_summary || !recommendations.strategic_approach) {
        throw new Error('Invalid recommendations response structure');
      }

      return recommendations;
    } catch (error: any) {
      if (error.name === 'SyntaxError') {
        logger.error('Failed to parse LLM recommendations response', { error: error.message });
        throw createError('Failed to process recommendations', 500);
      }
      throw error;
    }
  }

  async extractTextContent(rawContent: string, sourceType: string): Promise<string> {
    if (!this.isAvailable) {
      // Fallback to simple text cleaning when API is not available
      logger.info('Using fallback text extraction (API not available)');
      return this.simpleExtractTextContent(rawContent, sourceType);
    }

    const systemPrompt = `You are a content extraction specialist. Your task is to clean, structure, and extract meaningful text content from various source types while preserving important information.

Focus on:
1. Removing formatting artifacts and noise
2. Preserving meaningful content and context
3. Organizing information logically
4. Highlighting key cultural or traditional elements
5. Maintaining original meaning and nuance`;

    const userPrompt = `Extract and clean the meaningful content from this ${sourceType}:

${rawContent}

Please provide clean, well-structured text that preserves all important information while removing formatting artifacts and noise.`;

    try {
      const response = await this.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], this.defaultModel, 1500);

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Content extraction failed', { error });
      // Fallback to simple extraction on error
      return this.simpleExtractTextContent(rawContent, sourceType);
    }
  }

  async generateRecommendationsFromPrompts(
    systemInstruction: string,
    userPrompt: string
  ): Promise<any> {
    try {
      const response = await this.generateCompletion([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ], this.defaultModel, 3000);

      // Try to parse as JSON first, if not, structure the response
      let recommendations;
      const content = response.choices[0].message.content;
      
      try {
        recommendations = JSON.parse(content);
      } catch (jsonError) {
        // If not valid JSON, structure the response manually
        recommendations = this.parseUnstructuredRecommendations(content);
      }

      // Validate the response structure
      if (!recommendations.executive_summary) {
        recommendations.executive_summary = this.extractSection(content, 'executive summary') || 
                                          content.substring(0, 300) + '...';
      }

      if (!recommendations.strategic_approach) {
        recommendations.strategic_approach = this.extractListSection(content, 'strategic approach') || 
                                           this.extractListSection(content, 'strategy') || 
                                           ['Engage community leaders', 'Build trust through transparency', 'Respect cultural values'];
      }

      return recommendations;
    } catch (error) {
      logger.error('LLM recommendations generation failed', { error });
      throw createError('Failed to generate recommendations', 500);
    }
  }

  private parseUnstructuredRecommendations(content: string): any {
    return {
      executive_summary: this.extractSection(content, 'executive summary') || 
                        this.extractSection(content, 'summary') ||
                        content.substring(0, 300) + '...',
      strategic_approach: this.extractListSection(content, 'strategic approach') || 
                         this.extractListSection(content, 'strategy') || 
                         this.extractListSection(content, 'recommendations') ||
                         [],
      detailed_methods: this.extractListSection(content, 'detailed methods') ||
                       this.extractListSection(content, 'implementation') ||
                       this.extractListSection(content, 'methods') ||
                       [],
      risk_mitigation: this.extractListSection(content, 'risk mitigation') ||
                      this.extractListSection(content, 'risks') ||
                      [],
      timeline_recommendations: this.extractSection(content, 'timeline') || 
                               'Detailed timeline planning recommended based on community feedback',
      success_metrics: this.extractListSection(content, 'success metrics') ||
                      this.extractListSection(content, 'metrics') ||
                      ['Community acceptance rate', 'Stakeholder satisfaction', 'Cultural compliance'],
      cultural_considerations: this.extractListSection(content, 'cultural considerations') ||
                              this.extractListSection(content, 'cultural') ||
                              ['Respect local customs', 'Engage religious leaders', 'Consider Islamic practices'],
      confidence_score: 0.8 // Default for enhanced analysis
    };
  }

  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`(?:^|\\n)\\*?\\*?${sectionName}\\*?\\*?:?\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n[A-Z]|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractListSection(content: string, sectionName: string): string[] {
    const sectionContent = this.extractSection(content, sectionName);
    if (!sectionContent) return [];

    // Extract bulleted or numbered lists
    const listItems = sectionContent
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-*•\d+.)\s]+/, '').trim())
      .filter(line => line.length > 0);

    return listItems.slice(0, 10); // Limit to 10 items
  }

  async analyzeFeedback(
    originalRecommendation: string,
    implementation: string,
    outcome: string,
    rating: number
  ): Promise<{insights: string[]; improvements: string[]; lessons: string[]}> {
    const systemPrompt = `You are a learning system analyst specializing in cultural consultation and community engagement projects in Sampang, East Java.

Analyze implementation feedback to extract insights that will improve future recommendations. Focus on:
1. What worked well and why
2. What could be improved
3. Cultural factors that influenced outcomes
4. Lessons learned for similar future projects
5. Patterns in community response

Provide your analysis in valid JSON format with these fields:
- insights: array of key insights from this implementation
- improvements: array of suggested improvements for similar future projects  
- lessons: array of important lessons learned about Sampang community engagement`;

    const userPrompt = `Analyze this project implementation and feedback:

Original Recommendation: ${originalRecommendation}

Implementation Details: ${implementation}

Outcome: ${outcome}

Rating: ${rating}/5

Please extract insights, improvements, and lessons that will help improve future cultural recommendations for Sampang community engagement projects.`;

    try {
      const response = await this.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], this.defaultModel, 1500);

      const analysis = JSON.parse(response.choices[0].message.content);
      return analysis;
    } catch (error: any) {
      if (error.name === 'SyntaxError') {
        logger.error('Failed to parse feedback analysis response', { error: error.message });
        throw createError('Failed to process feedback analysis', 500);
      }
      throw error;
    }
  }

  // Fallback methods when API is not available
  private simpleAnalyzeCulturalContent(content: string, sourceType: string): CulturalAnalysis {
    const culturalKeywords = [
      'adat', 'tradisi', 'budaya', 'sampang', 'madura', 'jawa', 'islam', 'pesantren',
      'kyai', 'traditional', 'culture', 'community', 'religious', 'customs', 'practices'
    ];

    const foundElements: string[] = [];
    const lowerContent = content.toLowerCase();

    // Simple keyword-based extraction
    culturalKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        const sentences = content.split(/[.!?]+/);
        const relevantSentences = sentences.filter(sentence => 
          sentence.toLowerCase().includes(keyword)
        );
        foundElements.push(...relevantSentences.slice(0, 2).map(s => s.trim()));
      }
    });

    // Determine importance based on content length and keywords found
    let importanceLevel: 'high' | 'medium' | 'low' = 'medium';
    if (foundElements.length > 3 || content.length > 1000) {
      importanceLevel = 'high';
    } else if (foundElements.length < 2 || content.length < 300) {
      importanceLevel = 'low';
    }

    return {
      cultural_elements: foundElements.length > 0 ? foundElements : [
        `Content from ${sourceType} may contain cultural information relevant to Sampang community engagement`
      ],
      importance_level: importanceLevel,
      cultural_context: `This content (${sourceType}) has been analyzed using basic processing. Enhanced analysis with AI would provide deeper cultural insights.`,
      recommendations: [
        'Engage with local community leaders before implementation',
        'Respect Islamic values and customs in Sampang',
        'Consider traditional Madurese cultural practices',
        'Ensure transparent communication with stakeholders'
      ],
      potential_risks: [
        'Misunderstanding of local customs',
        'Insufficient community consultation',
        'Cultural sensitivity concerns'
      ],
      traditional_practices: foundElements.filter(element => 
        element.toLowerCase().includes('traditional') || 
        element.toLowerCase().includes('adat') ||
        element.toLowerCase().includes('tradisi')
      )
    };
  }

  private simpleExtractTextContent(rawContent: string, sourceType: string): string {
    // Basic text cleaning
    let cleaned = rawContent
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\w\s\.,!?;:()\-'"]/g, ' ')  // Remove special characters
      .replace(/\s+/g, ' ')  // Normalize whitespace again
      .trim();

    // If content is too long, truncate but try to end at sentence boundary
    if (cleaned.length > 5000) {
      const truncated = cleaned.substring(0, 4800);
      const lastPeriod = truncated.lastIndexOf('.');
      if (lastPeriod > 4000) {
        cleaned = truncated.substring(0, lastPeriod + 1);
      } else {
        cleaned = truncated + '...';
      }
    }

    return cleaned || `[Content extracted from ${sourceType} - processed with basic text cleaning]`;
  }
}

export const llmService = new LLMService();