// LLM Configuration and Model Settings

export const LLM_CONFIG = {
  // Available models for different tasks
  MODELS: {
    CULTURAL_ANALYSIS: 'anthropic/claude-3-sonnet',
    RECOMMENDATION_GENERATION: 'anthropic/claude-3-opus',
    CONTENT_EXTRACTION: 'anthropic/claude-3-haiku',
    FEEDBACK_ANALYSIS: 'anthropic/claude-3-sonnet',
    GENERAL: 'anthropic/claude-3-sonnet'
  },

  // Token limits for different operations
  TOKEN_LIMITS: {
    CULTURAL_ANALYSIS: 2000,
    RECOMMENDATION_GENERATION: 4000,
    CONTENT_EXTRACTION: 1500,
    FEEDBACK_ANALYSIS: 1500,
    GENERAL: 1000
  },

  // Temperature settings for different tasks
  TEMPERATURES: {
    CULTURAL_ANALYSIS: 0.3,  // More precise for cultural accuracy
    RECOMMENDATION_GENERATION: 0.7,  // More creative for strategies
    CONTENT_EXTRACTION: 0.1,  // Very precise for content extraction
    FEEDBACK_ANALYSIS: 0.5,  // Balanced for analysis
    GENERAL: 0.7
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    BACKOFF_DELAY: 1000, // milliseconds
    BACKOFF_MULTIPLIER: 2
  },

  // Rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000
  }
};

// Sampang-specific cultural context prompts
export const CULTURAL_CONTEXT = {
  SAMPANG_OVERVIEW: `Sampang is a regency in East Java, Indonesia, with a predominantly Madurese population. 
  The community values traditional Islamic practices, extended family structures, and agricultural traditions. 
  Key cultural elements include strong community leadership (kyai), traditional ceremonies, and deep respect for elders.`,

  KEY_CULTURAL_VALUES: [
    'Respect for religious leaders (kyai) and Islamic traditions',
    'Strong family and community bonds (gotong royong)',
    'Traditional Madurese honor system (harga diri)',
    'Agricultural and maritime livelihoods',
    'Traditional arts including Saronen music and Karapan Sapi (bull racing)',
    'Traditional conflict resolution mechanisms',
    'Respect for ancestral wisdom and local history'
  ],

  COMMON_CONCERNS: [
    'Land acquisition and compensation fairness',
    'Impact on traditional livelihoods',
    'Respect for religious sites and practices',
    'Employment opportunities for locals',
    'Environmental impact on agriculture and fishing',
    'Disruption to community social structures',
    'Cultural preservation and respect'
  ],

  SUCCESS_FACTORS: [
    'Early and continuous community engagement',
    'Involvement of respected local leaders',
    'Fair compensation and benefit sharing',
    'Employment and skill development programs',
    'Respect for religious and cultural practices',
    'Environmental protection measures',
    'Transparent communication and decision-making'
  ]
};

// Prompt templates for different analysis types
export const PROMPT_TEMPLATES = {
  CULTURAL_ANALYSIS: {
    SYSTEM: `You are an expert anthropologist specializing in Javanese and Madurese culture, particularly the Sampang region of East Java, Indonesia. 

Your expertise includes:
- Traditional Madurese customs and Islamic practices in Sampang
- Community social structures and leadership patterns
- Agricultural and maritime cultural practices
- Traditional conflict resolution and decision-making processes
- Local arts, ceremonies, and cultural expressions
- Economic systems and community cooperation patterns

${CULTURAL_CONTEXT.SAMPANG_OVERVIEW}

Analyze content to extract cultural wisdom and traditional practices that would help companies engage respectfully with Sampang communities.`,

    USER: `Analyze this content for cultural insights relevant to Sampang, East Java:

Content Type: {{sourceType}}
Content: {{content}}

Extract cultural elements, traditional practices, and local wisdom that could guide respectful community engagement.`
  },

  RECOMMENDATION_GENERATION: {
    SYSTEM: `You are a cultural consultant and business strategist specializing in community engagement in Sampang, East Java, Indonesia.

Your approach considers:
- Madurese cultural values and Islamic practices
- Traditional leadership structures and decision-making
- Community concerns and success factors
- Sustainable development principles
- Cultural sensitivity and respect

Key success factors for Sampang engagement:
${CULTURAL_CONTEXT.SUCCESS_FACTORS.map(factor => `- ${factor}`).join('\n')}

Common community concerns:
${CULTURAL_CONTEXT.COMMON_CONCERNS.map(concern => `- ${concern}`).join('\n')}

Generate actionable, culturally-sensitive recommendations that maximize community acceptance and project success.`,

    USER: `Generate comprehensive recommendations for this project in Sampang:

Project Type: {{projectType}}
Description: {{description}}
Cultural Context: {{culturalContext}}

Available Cultural Wisdom:
{{existingWisdom}}

Provide strategic recommendations that respect local culture and maximize community support.`
  }
};

// Quality checks for LLM responses
export const RESPONSE_VALIDATION = {
  CULTURAL_ANALYSIS: {
    REQUIRED_FIELDS: ['cultural_elements', 'importance_level', 'cultural_context', 'recommendations'],
    MIN_ELEMENTS: 2,
    VALID_IMPORTANCE_LEVELS: ['high', 'medium', 'low']
  },

  RECOMMENDATION_GENERATION: {
    REQUIRED_FIELDS: ['executive_summary', 'strategic_approach', 'cultural_considerations'],
    MIN_STRATEGIES: 3,
    CONFIDENCE_SCORE_RANGE: [0, 1]
  }
};