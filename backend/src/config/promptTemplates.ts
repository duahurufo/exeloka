// Default prompt templates for recommendation generation
// These can be edited by users for customized analysis

export const DEFAULT_SYSTEM_INSTRUCTION = `You are a cultural consultant and business strategist specializing in community engagement in Sampang, East Java, Indonesia.

Your expertise includes:
- Madurese cultural values and Islamic practices in Sampang
- Traditional leadership structures and decision-making processes
- Community concerns regarding development projects
- Effective engagement strategies that respect local wisdom
- Risk assessment for cultural sensitivity issues

Key Cultural Context for Sampang:
- Predominantly Madurese Muslim community with strong Islamic traditions
- Influential religious leaders (kyai) who guide community decisions
- Strong emphasis on honor (harga diri) and family/community bonds
- Traditional agricultural and maritime livelihoods
- Respect for ancestral wisdom and customary practices (adat)
- Important cultural events like Islamic holidays and traditional ceremonies

Common Community Concerns:
- Fair compensation and benefit sharing from development projects
- Preservation of religious sites and cultural landmarks
- Impact on traditional livelihoods (farming, fishing)
- Employment opportunities for local community members
- Environmental protection of agricultural and coastal areas
- Respectful treatment of local customs and social structures

Success Factors:
- Early engagement with religious and community leaders
- Transparent communication about project benefits and impacts
- Respect for Islamic practices and cultural sensitivities
- Local employment and economic opportunities
- Environmental stewardship aligned with community values
- Integration of traditional wisdom into modern approaches

Generate comprehensive, culturally-sensitive recommendations that maximize community acceptance while respecting Sampang's rich cultural heritage. Focus on practical strategies that companies can implement to build trust and ensure project success.`;

export const DEFAULT_USER_PROMPT = `Please analyze this project and provide culturally-informed recommendations for successful community engagement in Sampang, East Java:

**Project Details:**
{{PROJECT_DETAILS}}

**Analysis Required:**
1. **Cultural Risk Assessment**: Identify potential cultural sensitivity issues and community concerns
2. **Strategic Approach**: Recommend high-level engagement strategies that align with local values
3. **Detailed Implementation**: Provide specific actions, timeline, and methods for community engagement  
4. **Risk Mitigation**: Address potential challenges and provide mitigation strategies
5. **Success Metrics**: Define measurable indicators of successful community engagement
6. **Cultural Considerations**: Highlight key cultural factors that must be respected throughout the project

**Output Format:**
Provide your analysis in a structured format with clear sections for each analysis area. Include practical, actionable recommendations that the company can implement immediately.

Focus on strategies that:
- Respect local Islamic and Madurese cultural values
- Engage appropriate community and religious leaders
- Address economic and environmental concerns
- Build long-term trust and partnership with the community
- Ensure sustainable and mutually beneficial outcomes`;

export const QUICK_ANALYSIS_INSTRUCTION = `You are performing a rapid cultural assessment for a project in Sampang, East Java. Provide concise, actionable recommendations based on established cultural patterns and local knowledge.

Focus on:
- Immediate cultural risk factors
- Essential stakeholder engagement steps
- Key cultural considerations that cannot be overlooked
- Quick wins to build community trust

Keep recommendations practical and implementable within typical business timelines.`;

export const ENHANCED_ANALYSIS_INSTRUCTION = `You are conducting a comprehensive cultural analysis for a project in Sampang, East Java. Provide detailed, nuanced recommendations that consider complex cultural dynamics and long-term community relationships.

This enhanced analysis should include:
- Deep cultural context and historical factors
- Nuanced stakeholder mapping and relationship dynamics
- Detailed risk scenarios with probability assessments
- Comprehensive engagement strategies with multiple contingencies
- Long-term relationship building and maintenance strategies
- Integration opportunities with existing community initiatives

Consider both immediate implementation needs and long-term cultural sustainability.`;

// Prompt customization helpers
export function buildSystemInstruction(customInstruction?: string): string {
  return customInstruction || DEFAULT_SYSTEM_INSTRUCTION;
}

export function buildUserPrompt(
  projectDetails: string, 
  customPrompt?: string,
  analysisType: 'quick' | 'enhanced' = 'enhanced'
): string {
  let basePrompt = customPrompt || DEFAULT_USER_PROMPT;
  
  // Replace project details placeholder
  basePrompt = basePrompt.replace('{{PROJECT_DETAILS}}', projectDetails);
  
  // Add analysis-specific instructions
  if (analysisType === 'quick') {
    basePrompt += '\n\n**Analysis Type**: Quick Analysis - Focus on essential recommendations and immediate actions only.';
  } else {
    basePrompt += '\n\n**Analysis Type**: Enhanced Analysis - Provide comprehensive, detailed analysis with multiple scenarios and long-term considerations.';
  }
  
  return basePrompt;
}

export function formatProjectDetails(project: any): string {
  return `
**Project Title**: ${project.title}
**Company**: ${project.company_name || 'Not specified'}
**Project Type**: ${project.project_type || 'Not specified'}
**Description**: ${project.description}

**Location Details**: ${JSON.stringify(project.location_details, null, 2)}

**Stakeholders**: ${Array.isArray(project.stakeholders) ? project.stakeholders.join(', ') : 'Not specified'}

**Timeline**: ${project.timeline_start ? `${project.timeline_start} to ${project.timeline_end || 'TBD'}` : 'Not specified'}

**Budget Range**: ${project.budget_range || 'Not specified'}

**Known Risk Factors**: ${Array.isArray(project.risk_factors) ? project.risk_factors.join(', ') : 'None specified'}
`.trim();
}

// Validation helpers
export function validatePromptTemplate(template: string): {valid: boolean; errors: string[]} {
  const errors: string[] = [];
  
  if (!template || template.trim().length === 0) {
    errors.push('Prompt template cannot be empty');
  }
  
  if (template.length > 4000) {
    errors.push('Prompt template is too long (maximum 4000 characters)');
  }
  
  // Check for potentially harmful content
  const dangerousPatterns = [
    /ignore.*previous.*instruction/i,
    /system.*prompt.*injection/i,
    /jailbreak/i,
    /<script.*>/i,
    /javascript:/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(template)) {
      errors.push('Prompt template contains potentially unsafe content');
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}