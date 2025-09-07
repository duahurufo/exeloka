'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { projectAPI, learningAPI, knowledgeAPI } from '@/lib/api';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FolderIcon,
  LightBulbIcon,
  StarIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  overview: {
    total_projects: number;
    total_recommendations: number;
    total_knowledge_sources: number;
    avg_confidence_score: number;
    avg_feedback_rating: number;
    implementation_success_rate: number;
  };
  project_stats: {
    by_status: { status: string; count: number }[];
    by_type: { project_type: string; count: number }[];
    monthly_creation: { month: string; count: number }[];
  };
  recommendation_stats: {
    by_confidence: { range: string; count: number }[];
    by_type: { analysis_type: string; count: number; avg_confidence: number }[];
    monthly_generation: { month: string; count: number }[];
  };
  feedback_stats: {
    rating_distribution: { rating: number; count: number }[];
    monthly_feedback: { month: string; avg_rating: number; count: number }[];
  };
  cultural_insights: {
    top_categories: { category: string; usage_count: number }[];
    priority_areas: { area: string; usage_count: number }[];
    success_patterns: { pattern: string; success_rate: number }[];
  };
  performance_metrics: {
    avg_processing_time: number;
    document_generation_rate: number;
    user_engagement_rate: number;
    knowledge_utilization_rate: number;
  };
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [activeMetric, setActiveMetric] = useState('projects');

  const { data: analyticsData, isLoading } = useQuery(
    ['analytics-dashboard', dateRange],
    () => projectAPI.getAnalyticsDashboard(dateRange),
    {
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  const analytics = analyticsData?.data as AnalyticsData;

  const formatPercentage = (value: number) => Math.round(value * 100);
  const formatNumber = (value: number) => value.toLocaleString();

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return ArrowTrendingUpIcon;
    if (change < 0) return ArrowTrendingDownIcon;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Unavailable</h2>
        <p className="text-gray-600">Unable to load analytics data at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Comprehensive insights into your cultural engagement projects and AI recommendations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FolderIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.total_projects)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <LightBulbIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">AI Recommendations</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.total_recommendations)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(analytics.overview.implementation_success_rate)}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <StarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.avg_feedback_rating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Project Statistics */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Overview</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Project Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Projects by Status</h3>
              <div className="space-y-3">
                {analytics.project_stats.by_status.map((item) => {
                  const total = analytics.project_stats.by_status.reduce((sum, s) => sum + s.count, 0);
                  const percentage = total > 0 ? (item.count / total) * 100 : 0;
                  const statusColors = {
                    planning: 'bg-yellow-200',
                    analyzing: 'bg-blue-200',
                    completed: 'bg-green-200',
                    cancelled: 'bg-red-200'
                  };
                  
                  return (
                    <div key={item.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-600">{item.status}</span>
                        <span className="text-gray-900 font-medium">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${statusColors[item.status as keyof typeof statusColors] || 'bg-gray-300'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Types */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Projects by Type</h3>
              <div className="space-y-2">
                {analytics.project_stats.by_type.map((item) => (
                  <div key={item.project_type} className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 capitalize">{item.project_type || 'General'}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Avg Confidence Score</span>
                  <span className="text-sm font-medium">{formatPercentage(analytics.overview.avg_confidence_score)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${formatPercentage(analytics.overview.avg_confidence_score)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Document Generation</span>
                  <span className="text-sm font-medium">{formatPercentage(analytics.performance_metrics.document_generation_rate)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${formatPercentage(analytics.performance_metrics.document_generation_rate)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Knowledge Utilization</span>
                  <span className="text-sm font-medium">{formatPercentage(analytics.performance_metrics.knowledge_utilization_rate)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${formatPercentage(analytics.performance_metrics.knowledge_utilization_rate)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Processing Time</span>
                <span className="text-sm font-medium">{(analytics.performance_metrics.avg_processing_time / 1000).toFixed(2)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">User Engagement</span>
                <span className="text-sm font-medium">{formatPercentage(analytics.performance_metrics.user_engagement_rate)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis Performance</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Analysis Types</h3>
              <div className="space-y-2">
                {analytics.recommendation_stats.by_type.map((item) => (
                  <div key={item.analysis_type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{item.analysis_type}</span>
                      <p className="text-xs text-gray-500">{formatPercentage(item.avg_confidence)}% avg confidence</p>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{item.count} generated</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Confidence Distribution</h3>
              <div className="space-y-2">
                {analytics.recommendation_stats.by_confidence.map((item) => (
                  <div key={item.range} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.range}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback & Ratings</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Rating Distribution</h3>
              <div className="space-y-2">
                {analytics.feedback_stats.rating_distribution.map((item) => {
                  const total = analytics.feedback_stats.rating_distribution.reduce((sum, r) => sum + r.count, 0);
                  const percentage = total > 0 ? (item.count / total) * 100 : 0;
                  
                  return (
                    <div key={item.rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-20">
                        <StarIcon className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium">{item.rating}</span>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Insights */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cultural Insights & Patterns</h2>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Top Knowledge Categories</h3>
            <div className="space-y-2">
              {analytics.cultural_insights.top_categories.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">#{index + 1}</span>
                    <span className="text-sm text-gray-700">{item.category}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.usage_count} uses</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Priority Cultural Areas</h3>
            <div className="space-y-2">
              {analytics.cultural_insights.priority_areas.map((item) => (
                <div key={item.area} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{item.area}</span>
                  <span className="text-sm text-gray-500">{item.usage_count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Success Patterns</h3>
            <div className="space-y-2">
              {analytics.cultural_insights.success_patterns.map((item) => (
                <div key={item.pattern} className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">{item.pattern}</p>
                  <p className="text-xs text-green-600 mt-1">{formatPercentage(item.success_rate)}% success rate</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Base Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Knowledge Base Statistics</h2>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.total_knowledge_sources)}</p>
              <p className="text-sm text-gray-600">Knowledge Sources</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700">AI Analysis Engine: Operational</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700">Knowledge Base: {analytics.overview.total_knowledge_sources} sources</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700">Document Generation: Active</span>
            </div>
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-700">Avg Response Time: {(analytics.performance_metrics.avg_processing_time / 1000).toFixed(2)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}