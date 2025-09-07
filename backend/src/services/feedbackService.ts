import { getConnection } from '../config/database';
import { llmService } from './llmService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

interface FeedbackData {
  recommendation_id: number;
  user_id: number;
  rating: number;
  feedback_text?: string;
  implementation_success?: string;
  outcome_details?: string;
  lessons_learned?: string;
}

interface LearningInsight {
  insight_type: 'success_pattern' | 'failure_pattern' | 'cultural_factor' | 'implementation_tip';
  content: string;
  confidence_score: number;
  applicable_contexts: string[];
  source_feedback_count: number;
}

class FeedbackService {
  async processFeedback(feedbackData: FeedbackData): Promise<void> {
    try {
      logger.info('Processing feedback for learning', {
        recommendationId: feedbackData.recommendation_id,
        rating: feedbackData.rating,
        implementationSuccess: feedbackData.implementation_success
      });

      // Get the original recommendation for context
      const recommendation = await this.getRecommendationContext(feedbackData.recommendation_id);
      
      if (!recommendation) {
        logger.warn('Recommendation not found for feedback processing', {
          recommendationId: feedbackData.recommendation_id
        });
        return;
      }

      // Analyze feedback using LLM
      const analysis = await this.analyzeFeedbackWithLLM(recommendation, feedbackData);

      // Store learning insights
      await this.storeLearningInsights(feedbackData.recommendation_id, analysis);

      // Update recommendation confidence scores based on feedback
      await this.updateRecommendationMetrics(feedbackData);

      logger.info('Feedback processing completed', {
        recommendationId: feedbackData.recommendation_id,
        insightsGenerated: analysis.insights?.length || 0
      });

    } catch (error) {
      logger.error('Feedback processing failed', {
        error,
        feedbackData
      });
      // Don't throw - this is background processing
    }
  }

  private async getRecommendationContext(recommendationId: number): Promise<any> {
    const connection = getConnection();
    
    const [results] = await connection.execute(`
      SELECT r.*, p.title as project_title, p.description as project_description,
             p.project_type, p.location_details, p.stakeholders
      FROM recommendations r
      JOIN projects p ON r.project_id = p.id
      WHERE r.id = ?
    `, [recommendationId]) as any[];

    return results.length > 0 ? results[0] : null;
  }

  private async analyzeFeedbackWithLLM(
    recommendation: any, 
    feedbackData: FeedbackData
  ): Promise<{insights: string[]; improvements: string[]; lessons: string[]}> {
    try {
      // Build context for LLM analysis
      const originalRecommendation = {
        title: recommendation.title,
        strategic_approach: recommendation.strategic_approach,
        cultural_considerations: recommendation.cultural_considerations,
        confidence_score: recommendation.confidence_score
      };

      const implementationDetails = [
        feedbackData.feedback_text,
        feedbackData.outcome_details,
        feedbackData.lessons_learned
      ].filter(detail => detail && detail.trim()).join('\n\n');

      // Use LLM service to analyze feedback
      const analysis = await llmService.analyzeFeedback(
        JSON.stringify(originalRecommendation, null, 2),
        implementationDetails,
        feedbackData.outcome_details || `Rating: ${feedbackData.rating}/5, Success: ${feedbackData.implementation_success || 'unknown'}`,
        feedbackData.rating
      );

      return analysis;
    } catch (error) {
      logger.error('LLM feedback analysis failed', { error, recommendationId: recommendation.id });
      // Return default analysis if LLM fails
      return {
        insights: [`User rated this recommendation ${feedbackData.rating}/5 stars`],
        improvements: ['Consider gathering more detailed feedback for future analysis'],
        lessons: ['Feedback collection is important for system improvement']
      };
    }
  }

  private async storeLearningInsights(
    recommendationId: number, 
    analysis: {insights: string[]; improvements: string[]; lessons: string[]}
  ): Promise<void> {
    const connection = getConnection();

    // Create learning_insights table if it doesn't exist
    await this.ensureLearningInsightsTable(connection);

    // Store insights
    for (const insight of analysis.insights) {
      await connection.execute(`
        INSERT INTO learning_insights 
        (insight_type, content, confidence_level, source_recommendation_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, ['success_pattern', insight, 0.7, recommendationId]);
    }

    // Store improvements as lessons
    for (const improvement of analysis.improvements) {
      await connection.execute(`
        INSERT INTO learning_insights 
        (insight_type, content, confidence_level, source_recommendation_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, ['implementation_tip', improvement, 0.6, recommendationId]);
    }

    // Store general lessons
    for (const lesson of analysis.lessons) {
      await connection.execute(`
        INSERT INTO learning_insights 
        (insight_type, content, confidence_level, source_recommendation_id, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, ['cultural_factor', lesson, 0.8, recommendationId]);
    }
  }

  private async ensureLearningInsightsTable(connection: any): Promise<void> {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS learning_insights (
        id INT PRIMARY KEY AUTO_INCREMENT,
        insight_type ENUM('success_pattern', 'failure_pattern', 'cultural_factor', 'implementation_tip') NOT NULL,
        content TEXT NOT NULL,
        confidence_score DECIMAL(3,2) DEFAULT 0.5,
        applicable_contexts JSON,
        source_recommendation_id INT,
        feedback_count INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_insight_type (insight_type),
        INDEX idx_confidence (confidence_score),
        FOREIGN KEY (source_recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL
      )
    `);
  }

  private async updateRecommendationMetrics(feedbackData: FeedbackData): Promise<void> {
    const connection = getConnection();

    // Get current recommendation data
    const [recommendations] = await connection.execute(
      'SELECT confidence_score, llm_analysis FROM recommendations WHERE id = ?',
      [feedbackData.recommendation_id]
    ) as any[];

    if (!recommendations.length) return;

    const recommendation = recommendations[0];
    let llmAnalysis = typeof recommendation.llm_analysis === 'string' 
      ? JSON.parse(recommendation.llm_analysis) 
      : recommendation.llm_analysis;

    // Update metrics with feedback
    if (!llmAnalysis.feedback_metrics) {
      llmAnalysis.feedback_metrics = {
        total_feedback: 0,
        average_rating: 0,
        implementation_success_rate: 0,
        feedback_history: []
      };
    }

    const metrics = llmAnalysis.feedback_metrics;
    metrics.total_feedback += 1;
    
    // Calculate new average rating
    const currentTotal = (metrics.average_rating * (metrics.total_feedback - 1)) + feedbackData.rating;
    metrics.average_rating = Number((currentTotal / metrics.total_feedback).toFixed(2));

    // Track implementation success
    if (feedbackData.implementation_success) {
      const successValues = ['successful', 'exceeded'];
      const isSuccess = successValues.includes(feedbackData.implementation_success);
      
      if (!metrics.success_count) metrics.success_count = 0;
      if (isSuccess) metrics.success_count += 1;
      
      metrics.implementation_success_rate = Number((metrics.success_count / metrics.total_feedback).toFixed(2));
    }

    // Add to feedback history (keep last 10)
    metrics.feedback_history.push({
      rating: feedbackData.rating,
      success: feedbackData.implementation_success,
      date: new Date().toISOString()
    });

    if (metrics.feedback_history.length > 10) {
      metrics.feedback_history = metrics.feedback_history.slice(-10);
    }

    // Adjust confidence score based on feedback
    let newConfidenceScore = recommendation.confidence_score;
    
    if (feedbackData.rating >= 4 && feedbackData.implementation_success === 'successful') {
      newConfidenceScore = Math.min(1.0, newConfidenceScore + 0.05);
    } else if (feedbackData.rating <= 2 || feedbackData.implementation_success === 'failed') {
      newConfidenceScore = Math.max(0.1, newConfidenceScore - 0.1);
    }

    // Update recommendation
    await connection.execute(`
      UPDATE recommendations 
      SET confidence_score = ?, llm_analysis = ?, updated_at = NOW()
      WHERE id = ?
    `, [newConfidenceScore, JSON.stringify(llmAnalysis), feedbackData.recommendation_id]);

    logger.info('Recommendation metrics updated', {
      recommendationId: feedbackData.recommendation_id,
      newConfidenceScore,
      averageRating: metrics.average_rating,
      totalFeedback: metrics.total_feedback
    });
  }

  async getLearningInsights(options: {
    insight_type?: string;
    limit?: number;
    min_confidence?: number;
  } = {}): Promise<LearningInsight[]> {
    const connection = getConnection();
    
    let sql = `
      SELECT li.*, COUNT(*) OVER (PARTITION BY li.insight_type) as type_count
      FROM learning_insights li
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options.insight_type) {
      sql += ` AND li.insight_type = ?`;
      params.push(options.insight_type);
    }

    if (options.min_confidence) {
      sql += ` AND li.confidence_level >= ?`;
      params.push(options.min_confidence);
    }

    sql += ` ORDER BY li.confidence_level DESC, li.created_at DESC`;

    if (options.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    const [insights] = await connection.execute(sql, params) as any[];

    return insights.map((insight: any) => ({
      insight_type: insight.insight_type,
      content: insight.content,
      confidence_score: insight.confidence_level,
      applicable_contexts: insight.applicable_contexts ? JSON.parse(insight.applicable_contexts) : [],
      source_feedback_count: insight.feedback_count || 1
    }));
  }

  async getRecommendationFeedbackSummary(recommendationId: number): Promise<any> {
    const connection = getConnection();

    // Get all feedback for this recommendation
    const [feedbackRows] = await connection.execute(`
      SELECT rating, implementation_success, outcome_details, lessons_learned, created_at
      FROM feedback
      WHERE recommendation_id = ?
      ORDER BY created_at DESC
    `, [recommendationId]) as any[];

    if (feedbackRows.length === 0) {
      return {
        total_feedback: 0,
        average_rating: 0,
        implementation_success_rate: 0,
        recent_feedback: []
      };
    }

    // Calculate metrics
    const ratings = feedbackRows.map((f: any) => f.rating).filter((r: number) => r > 0);
    const averageRating = ratings.length > 0 
      ? Number((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2))
      : 0;

    const successfulImplementations = feedbackRows.filter((f: any) => 
      f.implementation_success === 'successful' || f.implementation_success === 'exceeded'
    ).length;

    const implementationsWithStatus = feedbackRows.filter((f: any) => 
      f.implementation_success && f.implementation_success !== 'not_implemented'
    ).length;

    const successRate = implementationsWithStatus > 0 
      ? Number((successfulImplementations / implementationsWithStatus).toFixed(2))
      : 0;

    return {
      total_feedback: feedbackRows.length,
      average_rating: averageRating,
      implementation_success_rate: successRate,
      successful_implementations: successfulImplementations,
      total_implementations: implementationsWithStatus,
      recent_feedback: feedbackRows.slice(0, 5).map((f: any) => ({
        rating: f.rating,
        implementation_success: f.implementation_success,
        outcome_summary: f.outcome_details ? f.outcome_details.substring(0, 200) + '...' : null,
        lessons_summary: f.lessons_learned ? f.lessons_learned.substring(0, 200) + '...' : null,
        date: f.created_at
      }))
    };
  }

  async getSystemLearningStats(): Promise<any> {
    const connection = getConnection();

    // Get overall feedback statistics
    const [overallStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_feedback,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN implementation_success IN ('successful', 'exceeded') THEN 1 END) as successful_implementations,
        COUNT(CASE WHEN implementation_success IS NOT NULL AND implementation_success != 'not_implemented' THEN 1 END) as total_implementations
      FROM feedback
    `) as any[];

    // Get learning insights count by type
    const [insightStats] = await connection.execute(`
      SELECT 
        insight_type,
        COUNT(*) as count,
        AVG(confidence_level) as avg_confidence
      FROM learning_insights
      GROUP BY insight_type
    `) as any[];

    // Get recent learning trends
    const [recentTrends] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as feedback_count,
        AVG(rating) as avg_rating
      FROM feedback
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `) as any[];

    const stats = overallStats[0] || {
      total_feedback: 0,
      average_rating: 0,
      successful_implementations: 0,
      total_implementations: 0
    };
    
    const successRate = stats.total_implementations > 0 
      ? Number((stats.successful_implementations / stats.total_implementations).toFixed(2))
      : 0;

    return {
      overall: {
        total_feedback: stats.total_feedback || 0,
        average_rating: Number((stats.average_rating || 0).toFixed ? (stats.average_rating || 0).toFixed(2) : stats.average_rating || 0),
        implementation_success_rate: successRate,
        total_learning_insights: (insightStats || []).reduce((sum: number, stat: any) => sum + (stat.count || 0), 0)
      },
      insights_by_type: (insightStats || []).map((stat: any) => ({
        type: stat.insight_type,
        count: stat.count || 0,
        average_confidence: Number((stat.avg_confidence || 0).toFixed ? (stat.avg_confidence || 0).toFixed(2) : stat.avg_confidence || 0)
      })),
      recent_trends: recentTrends || []
    };
  }
}

export const feedbackService = new FeedbackService();