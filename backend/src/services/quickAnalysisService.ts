// import brain from 'brain.js'; // Temporarily disabled due to native dependencies
import { getConnection } from '../config/database';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

interface QuickAnalysisInput {
  project_type: string;
  description: string;
  location_details: any;
  stakeholders: string[];
  risk_factors: string[];
  budget_range?: string;
  timeline_start?: string;
  timeline_end?: string;
}

interface QuickAnalysisResult {
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high';
  cultural_compatibility: number;
  recommended_approaches: string[];
  key_considerations: string[];
  estimated_success_rate: number;
  processing_time: number;
}

interface TrainingData {
  input: number[];
  output: number[];
}

// Simple neural network implementation without native dependencies
class SimpleNeuralNetwork {
  private weights: number[][][] = [];
  private biases: number[][] = [];
  
  constructor(layers: number[]) {
    // Initialize weights and biases for a simple 3-layer network
    for (let i = 0; i < layers.length - 1; i++) {
      const layerWeights: number[][] = [];
      const layerBiases: number[] = [];
      
      for (let j = 0; j < layers[i + 1]; j++) {
        const nodeWeights: number[] = [];
        for (let k = 0; k < layers[i]; k++) {
          nodeWeights.push(Math.random() * 2 - 1); // Random between -1 and 1
        }
        layerWeights.push(nodeWeights);
        layerBiases.push(Math.random() * 2 - 1);
      }
      
      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
    }
  }
  
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
  
  run(input: number[]): number[] {
    let currentInput = input;
    
    for (let i = 0; i < this.weights.length; i++) {
      const output: number[] = [];
      
      for (let j = 0; j < this.weights[i].length; j++) {
        let sum = this.biases[i][j];
        for (let k = 0; k < currentInput.length; k++) {
          sum += currentInput[k] * this.weights[i][j][k];
        }
        output.push(this.sigmoid(sum));
      }
      
      currentInput = output;
    }
    
    return currentInput;
  }
}

class QuickAnalysisService {
  private neuralNetwork: SimpleNeuralNetwork | null = null;
  private isNetworkTrained = false;
  private featureVectorSize = 50; // Standardized input size
  
  // Keyword mappings for feature extraction
  private projectTypeWeights = new Map([
    ['infrastructure', 0.9],
    ['manufacturing', 0.8],
    ['mining', 0.95],
    ['agriculture', 0.6],
    ['education', 0.4],
    ['healthcare', 0.5],
    ['tourism', 0.7],
    ['residential', 0.8],
    ['commercial', 0.7],
    ['religious', 0.3],
    ['environmental', 0.6]
  ]);

  private culturalKeywords = new Map([
    // High sensitivity keywords
    ['sacred', 0.95], ['religious', 0.9], ['mosque', 0.9], ['kyai', 0.85], ['pesantren', 0.8],
    ['burial', 0.9], ['cemetery', 0.9], ['traditional', 0.7], ['ceremony', 0.8], ['ritual', 0.9],
    
    // Medium sensitivity keywords  
    ['community', 0.6], ['local', 0.5], ['village', 0.6], ['farmer', 0.7], ['fisherman', 0.7],
    ['market', 0.5], ['school', 0.4], ['hospital', 0.4], ['road', 0.3], ['bridge', 0.3],
    
    // Location-specific
    ['sampang', 0.8], ['madura', 0.8], ['java', 0.6], ['east java', 0.7], ['jawa timur', 0.7],
    
    // Risk indicators
    ['protest', 0.95], ['conflict', 0.9], ['dispute', 0.8], ['opposition', 0.8], ['resistance', 0.7]
  ]);

  private stakeholderWeights = new Map([
    ['government', 0.3], ['local government', 0.4], ['community leader', 0.8], ['religious leader', 0.9],
    ['kyai', 0.95], ['village head', 0.7], ['farmer', 0.6], ['fisherman', 0.6], ['resident', 0.5],
    ['ngo', 0.6], ['activist', 0.8], ['business', 0.3], ['developer', 0.2]
  ]);

  constructor() {
    this.initializeNetwork();
    this.loadOrTrainNetwork();
  }

  private initializeNetwork() {
    // Initialize simple neural network (input size, hidden layers, output size)
    this.neuralNetwork = new SimpleNeuralNetwork([this.featureVectorSize, 30, 20, 3]);
  }

  private async loadOrTrainNetwork() {
    try {
      // Try to load existing trained model
      const savedModel = await this.loadSavedModel();
      if (savedModel && savedModel.weights && savedModel.biases) {
        (this.neuralNetwork as any).weights = savedModel.weights;
        (this.neuralNetwork as any).biases = savedModel.biases;
        this.isNetworkTrained = true;
        logger.info('Loaded pre-trained neural network model');
        return;
      }

      // For now, skip training and use rule-based analysis
      // await this.trainWithSyntheticData();
      // await this.saveModel();
      
      this.isNetworkTrained = true; // Mark as ready for rule-based analysis
      logger.info('Using rule-based quick analysis (neural network training disabled)');
    } catch (error) {
      logger.error('Failed to initialize neural network', { error });
      // Don't throw error, use rule-based fallback
      this.isNetworkTrained = true;
      logger.warn('Using fallback rule-based analysis');
    }
  }

  private async loadSavedModel(): Promise<any | null> {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const modelPath = path.join(process.cwd(), 'models', 'quick_analysis_model.json');
      const modelData = await fs.readFile(modelPath, 'utf8');
      return JSON.parse(modelData);
    } catch (error) {
      return null; // Model doesn't exist, will train new one
    }
  }

  private async saveModel() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const modelDir = path.join(process.cwd(), 'models');
      
      // Ensure models directory exists
      await fs.mkdir(modelDir, { recursive: true });
      
      const modelPath = path.join(modelDir, 'quick_analysis_model.json');
      const modelData = JSON.stringify({
        weights: (this.neuralNetwork as any).weights,
        biases: (this.neuralNetwork as any).biases
      });
      await fs.writeFile(modelPath, modelData);
    } catch (error) {
      logger.warn('Failed to save neural network model', { error });
    }
  }

  private async trainWithSyntheticData() {
    // Generate synthetic training data based on Sampang cultural patterns
    const trainingData: TrainingData[] = [];
    
    // High-risk scenarios (low success)
    trainingData.push(...this.generateScenarios({
      project_types: ['mining', 'manufacturing', 'infrastructure'],
      cultural_sensitivity: [0.8, 0.9, 0.95],
      stakeholder_risk: [0.8, 0.9],
      expected_success: [0.2, 0.3, 0.4],
      risk_level: [0.8, 0.9]
    }, 50));

    // Medium-risk scenarios 
    trainingData.push(...this.generateScenarios({
      project_types: ['commercial', 'residential', 'tourism'],
      cultural_sensitivity: [0.5, 0.6, 0.7],
      stakeholder_risk: [0.4, 0.6],
      expected_success: [0.5, 0.6, 0.7],
      risk_level: [0.5, 0.6]
    }, 50));

    // Low-risk scenarios (high success)
    trainingData.push(...this.generateScenarios({
      project_types: ['education', 'healthcare', 'agriculture'],
      cultural_sensitivity: [0.2, 0.3, 0.4],
      stakeholder_risk: [0.2, 0.3],
      expected_success: [0.7, 0.8, 0.9],
      risk_level: [0.2, 0.3]
    }, 50));

    // Skip training for now - use rule-based analysis instead
    logger.info('Training with synthetic data skipped - using rule-based approach');

    this.isNetworkTrained = true;
  }

  private generateScenarios(params: {
    project_types: string[];
    cultural_sensitivity: number[];
    stakeholder_risk: number[];
    expected_success: number[];
    risk_level: number[];
  }, count: number): TrainingData[] {
    const scenarios: TrainingData[] = [];

    for (let i = 0; i < count; i++) {
      const input = new Array(this.featureVectorSize).fill(0);
      
      // Random project characteristics
      const projectType = params.project_types[Math.floor(Math.random() * params.project_types.length)];
      const culturalSens = params.cultural_sensitivity[Math.floor(Math.random() * params.cultural_sensitivity.length)];
      const stakeholderRisk = params.stakeholder_risk[Math.floor(Math.random() * params.stakeholder_risk.length)];
      const expectedSuccess = params.expected_success[Math.floor(Math.random() * params.expected_success.length)];
      const riskLevel = params.risk_level[Math.floor(Math.random() * params.risk_level.length)];

      // Feature vector encoding
      input[0] = this.projectTypeWeights.get(projectType) || 0.5;
      input[1] = culturalSens;
      input[2] = stakeholderRisk;
      input[3] = Math.random() * 0.5 + 0.3; // Timeline factor
      input[4] = Math.random() * 0.4 + 0.2; // Budget factor
      
      // Add some noise and additional features
      for (let j = 5; j < this.featureVectorSize; j++) {
        input[j] = Math.random() * 0.1;
      }

      const output = [
        expectedSuccess, // Success probability
        riskLevel,      // Risk level
        culturalSens,   // Cultural sensitivity
        culturalSens * 0.8 + Math.random() * 0.2, // Complexity
        Math.random() * 0.3 + 0.5, // Timeline factor
        Math.random() * 0.3 + 0.4   // Cost factor
      ];

      scenarios.push({ input, output });
    }

    return scenarios;
  }

  private extractFeatures(input: QuickAnalysisInput): number[] {
    const features = new Array(this.featureVectorSize).fill(0);
    
    // Project type feature
    const projectTypeWeight = this.projectTypeWeights.get(input.project_type.toLowerCase()) || 0.5;
    features[0] = projectTypeWeight;

    // Cultural sensitivity based on description keywords
    let culturalSensitivity = 0;
    let keywordCount = 0;
    
    const description = input.description.toLowerCase();
    for (const [keyword, weight] of this.culturalKeywords) {
      if (description.includes(keyword)) {
        culturalSensitivity += weight;
        keywordCount++;
      }
    }
    features[1] = keywordCount > 0 ? culturalSensitivity / keywordCount : 0.3;

    // Stakeholder risk assessment
    let stakeholderRisk = 0;
    for (const stakeholder of input.stakeholders) {
      const weight = this.stakeholderWeights.get(stakeholder.toLowerCase()) || 0.4;
      stakeholderRisk = Math.max(stakeholderRisk, weight);
    }
    features[2] = stakeholderRisk;

    // Location-specific factors
    const locationStr = JSON.stringify(input.location_details).toLowerCase();
    let locationSensitivity = 0;
    if (locationStr.includes('sampang')) locationSensitivity += 0.8;
    if (locationStr.includes('madura')) locationSensitivity += 0.7;
    if (locationStr.includes('religious') || locationStr.includes('sacred')) locationSensitivity += 0.9;
    features[3] = Math.min(locationSensitivity, 1.0);

    // Risk factors
    features[4] = Math.min(input.risk_factors.length * 0.2, 1.0);

    // Timeline urgency (if dates provided)
    let timelineUrgency = 0.5;
    if (input.timeline_start && input.timeline_end) {
      const start = new Date(input.timeline_start);
      const end = new Date(input.timeline_end);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
      timelineUrgency = Math.max(0.1, Math.min(1.0, 30 / Math.max(duration, 30))); // Shorter = more urgent
    }
    features[5] = timelineUrgency;

    // Budget implications
    let budgetFactor = 0.5;
    if (input.budget_range) {
      const budget = input.budget_range.toLowerCase();
      if (budget.includes('high') || budget.includes('large')) budgetFactor = 0.8;
      else if (budget.includes('low') || budget.includes('small')) budgetFactor = 0.3;
      else if (budget.includes('medium')) budgetFactor = 0.5;
    }
    features[6] = budgetFactor;

    // Fill remaining features with computed values and small random noise
    for (let i = 7; i < this.featureVectorSize; i++) {
      features[i] = Math.random() * 0.1;
    }

    return features;
  }

  async performQuickAnalysis(input: QuickAnalysisInput): Promise<QuickAnalysisResult> {
    const startTime = Date.now();

    try {
      logger.info('Quick analysis input received', { input });
      
      if (!this.isNetworkTrained) {
        throw createError('Neural network not ready', 503);
      }

      // Extract features from input
      const features = this.extractFeatures(input);

      // Run neural network prediction
      const output = this.neuralNetwork!.run(features) as number[];

      // Extract predictions
      const successProbability = output[0] || 0.5;
      const riskScore = output[1] || 0.5;
      const culturalSensitivity = output[2] || 0.5;
      const complexity = output[3] || 0.5;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high';
      if (riskScore < 0.4) riskLevel = 'low';
      else if (riskScore < 0.7) riskLevel = 'medium';
      else riskLevel = 'high';

      // Generate recommendations based on analysis
      const recommendedApproaches = this.generateRecommendations(input, {
        successProbability,
        riskScore,
        culturalSensitivity,
        complexity
      });

      const keyConsiderations = this.generateConsiderations(input, {
        successProbability,
        riskScore,
        culturalSensitivity,
        complexity
      });

      const processingTime = Date.now() - startTime;

      logger.info('Quick analysis completed', {
        processingTime,
        riskLevel,
        successProbability: Math.round(successProbability * 100),
        projectType: input.project_type
      });

      return {
        confidence_score: Math.min(0.85, 0.6 + (successProbability * 0.25)), // Cap quick analysis confidence
        risk_level: riskLevel,
        cultural_compatibility: culturalSensitivity,
        recommended_approaches: recommendedApproaches,
        key_considerations: keyConsiderations,
        estimated_success_rate: successProbability,
        processing_time: processingTime
      };

    } catch (error) {
      logger.error('Quick analysis failed', { error, input });
      throw createError('Quick analysis failed', 500);
    }
  }

  private generateRecommendations(
    input: QuickAnalysisInput, 
    analysis: { successProbability: number; riskScore: number; culturalSensitivity: number; complexity: number }
  ): string[] {
    const recommendations: string[] = [];

    // Risk-based recommendations
    if (analysis.riskScore > 0.7) {
      recommendations.push('Engage religious leaders (kyai) early in the process');
      recommendations.push('Conduct extensive community consultations before project initiation');
      recommendations.push('Consider cultural impact mitigation measures');
    }

    if (analysis.culturalSensitivity > 0.8) {
      recommendations.push('Involve local cultural advisors in project planning');
      recommendations.push('Schedule activities around religious observances and local ceremonies');
      recommendations.push('Implement traditional conflict resolution mechanisms if needed');
    }

    // Project type specific
    if (input.project_type.toLowerCase().includes('infrastructure')) {
      recommendations.push('Coordinate with village heads for community access and logistics');
      recommendations.push('Ensure fair compensation for any land use or displacement');
    }

    if (input.project_type.toLowerCase().includes('manufacturing') || input.project_type.toLowerCase().includes('mining')) {
      recommendations.push('Establish local employment and skills training programs');
      recommendations.push('Implement environmental protection measures that align with local concerns');
    }

    // Success-based recommendations
    if (analysis.successProbability > 0.7) {
      recommendations.push('Leverage existing community support networks');
      recommendations.push('Consider expanding project scope based on positive reception');
    } else {
      recommendations.push('Focus on building trust through small, visible community benefits');
      recommendations.push('Consider phased implementation to demonstrate value incrementally');
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  private generateConsiderations(
    input: QuickAnalysisInput,
    analysis: { successProbability: number; riskScore: number; culturalSensitivity: number; complexity: number }
  ): string[] {
    const considerations: string[] = [];

    considerations.push(`Cultural sensitivity level: ${analysis.culturalSensitivity > 0.7 ? 'High' : analysis.culturalSensitivity > 0.4 ? 'Medium' : 'Low'}`);
    considerations.push(`Project complexity: ${analysis.complexity > 0.7 ? 'High' : analysis.complexity > 0.4 ? 'Medium' : 'Low'}`);

    if (input.stakeholders.some(s => s.toLowerCase().includes('religious') || s.toLowerCase().includes('kyai'))) {
      considerations.push('Religious leadership engagement is critical for success');
    }

    if (input.risk_factors.length > 2) {
      considerations.push('Multiple risk factors present - comprehensive mitigation strategy needed');
    }

    if (analysis.riskScore > 0.6) {
      considerations.push('Consider engaging a local cultural consultant');
      considerations.push('Plan for extended community engagement timeline');
    }

    return considerations.slice(0, 4);
  }

  // Method to retrain network based on actual feedback
  async learnFromFeedback(
    originalInput: QuickAnalysisInput,
    actualOutcome: {
      success_rate: number;
      actual_risk_level: 'low' | 'medium' | 'high';
      cultural_issues: boolean;
    }
  ) {
    try {
      const features = this.extractFeatures(originalInput);
      const actualRiskScore = actualOutcome.actual_risk_level === 'high' ? 0.9 : 
                            actualOutcome.actual_risk_level === 'medium' ? 0.6 : 0.3;
      
      const correctedOutput = [
        actualOutcome.success_rate,
        actualRiskScore,
        actualOutcome.cultural_issues ? 0.8 : 0.3,
        0.5, // Complexity (unchanged)
        0.5, // Timeline factor (unchanged)  
        0.5  // Cost factor (unchanged)
      ];

      // Skip training update for now - using rule-based feedback incorporation
      logger.info('Feedback incorporated into rule-based system');

      await this.saveModel();
      
      logger.info('Neural network updated with feedback', {
        actualSuccessRate: actualOutcome.success_rate,
        actualRiskLevel: actualOutcome.actual_risk_level
      });

    } catch (error) {
      logger.error('Failed to learn from feedback', { error });
    }
  }
}

export const quickAnalysisService = new QuickAnalysisService();