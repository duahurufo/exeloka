'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recommendationAPI } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  StarIcon,
  FolderIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface Recommendation {
  id: number;
  title: string;
  project_id: number;
  project_title: string;
  analysis_type: 'quick' | 'enhanced';
  confidence_score: number;
  key_insights: string[];
  recommendations: string[];
  potential_risks: string[];
  cultural_considerations: string[];
  implementation_timeline: string;
  success_metrics: string[];
  created_at: string;
  updated_at: string;
  feedback_rating?: number;
  feedback_comments?: string;
  document_generated: boolean;
  ai_analysis_data?: any;
}

export default function RecommendationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recommendationId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [activeTab, setActiveTab] = useState('insights');

  const { data: recommendationData, isLoading } = useQuery(
    ['recommendation', recommendationId],
    () => recommendationAPI.getById(recommendationId),
    {
      enabled: !!recommendationId
    }
  );

  const submitFeedbackMutation = useMutation(
    (feedback: { rating: number; comments?: string }) => 
      recommendationAPI.submitFeedback(recommendationId, feedback),
    {
      onSuccess: () => {
        toast.success('Feedback submitted successfully!');
        queryClient.invalidateQueries(['recommendation', recommendationId]);
        setShowFeedbackModal(false);
        setFeedbackRating(0);
        setFeedbackComments('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to submit feedback');
      }
    }
  );

  const generateDocumentMutation = useMutation(
    (format: 'docx' | 'xlsx' | 'pptx') => 
      recommendationAPI.generateDocument(recommendationId, format),
    {
      onSuccess: (response, format) => {
        toast.success(`${format.toUpperCase()} document generated successfully!`);
        queryClient.invalidateQueries(['recommendation', recommendationId]);
        
        // Handle file download
        const blob = new Blob([response.data], { 
          type: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recommendation-${recommendationId}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to generate document');
      }
    }
  );

  const recommendation = recommendationData?.data?.data;

  const handleSubmitFeedback = () => {
    if (feedbackRating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    
    submitFeedbackMutation.mutate({
      rating: feedbackRating,
      comments: feedbackComments || undefined
    });
  };

  const handleGenerateDocument = (format: 'docx' | 'xlsx' | 'pptx') => {
    generateDocumentMutation.mutate(format);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="text-center py-12">
        <LightBulbIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Recommendation not found</h2>
        <p className="text-gray-600 mb-4">The requested recommendation could not be found.</p>
        <Link href="/dashboard/recommendations" className="btn-primary">
          Back to Recommendations
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'insights', label: 'Key Insights', icon: LightBulbIcon },
    { id: 'recommendations', label: 'Recommendations', icon: CheckCircleIcon },
    { id: 'risks', label: 'Potential Risks', icon: ExclamationTriangleIcon },
    { id: 'cultural', label: 'Cultural Context', icon: EyeIcon },
    { id: 'metrics', label: 'Success Metrics', icon: ChartBarIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Link 
            href="/dashboard/recommendations"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{recommendation.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <Link
                href={`/dashboard/projects/${recommendation.project_id}`}
                className="flex items-center hover:text-blue-600"
              >
                <FolderIcon className="h-4 w-4 mr-1" />
                {recommendation.project_title}
              </Link>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                recommendation.analysis_type === 'quick' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {recommendation.analysis_type === 'quick' ? 'Quick Analysis' : 'Enhanced Analysis'}
              </span>
              
              <div className={`flex items-center ${
                recommendation.confidence_score >= 0.8 ? 'text-green-600' :
                recommendation.confidence_score >= 0.6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                {Math.round(recommendation.confidence_score * 100)}% Confidence
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {new Date(recommendation.created_at).toLocaleDateString()}
              </div>
              
              {recommendation.feedback_rating && (
                <div className="flex items-center text-yellow-600">
                  <StarIcon className="h-4 w-4 mr-1" />
                  {recommendation.feedback_rating}/5
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!recommendation.feedback_rating && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>Provide Feedback</span>
            </button>
          )}
          
          <div className="relative group">
            <button className="btn-primary flex items-center space-x-2">
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="py-1">
                <button
                  onClick={() => handleGenerateDocument('docx')}
                  disabled={generateDocumentMutation.isLoading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export to Word (.docx)
                </button>
                <button
                  onClick={() => handleGenerateDocument('xlsx')}
                  disabled={generateDocumentMutation.isLoading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export to Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleGenerateDocument('pptx')}
                  disabled={generateDocumentMutation.isLoading}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export to PowerPoint (.pptx)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="card">
            {activeTab === 'insights' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h2>
                {recommendation.key_insights && recommendation.key_insights.length > 0 ? (
                  <ul className="space-y-3">
                    {recommendation.key_insights.map((insight: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <LightBulbIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No key insights available.</p>
                )}
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Strategic Recommendations</h2>
                {recommendation.recommendations && recommendation.recommendations.length > 0 ? (
                  <ul className="space-y-4">
                    {recommendation.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-700 font-medium mb-1">Recommendation {index + 1}</p>
                          <p className="text-gray-600">{rec}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No recommendations available.</p>
                )}
              </div>
            )}

            {activeTab === 'risks' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Potential Risks & Mitigation</h2>
                {recommendation.potential_risks && recommendation.potential_risks.length > 0 ? (
                  <ul className="space-y-4">
                    {recommendation.potential_risks.map((risk: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-700 font-medium mb-1">Risk {index + 1}</p>
                          <p className="text-gray-600">{risk}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No potential risks identified.</p>
                )}
              </div>
            )}

            {activeTab === 'cultural' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Cultural Considerations</h2>
                {recommendation.cultural_considerations && recommendation.cultural_considerations.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {recommendation.cultural_considerations.map((consideration: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                        >
                          {consideration}
                        </span>
                      ))}
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-medium text-orange-800 mb-2">Cultural Wisdom Advisory</h3>
                      <p className="text-orange-700 text-sm">
                        These cultural considerations are specific to the Sampang region of East Java, Indonesia. 
                        Please ensure all stakeholders understand and respect these cultural nuances for project success.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No cultural considerations specified.</p>
                )}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Success Metrics & KPIs</h2>
                {recommendation.success_metrics && recommendation.success_metrics.length > 0 ? (
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {recommendation.success_metrics.map((metric: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <ChartBarIcon className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{metric}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {recommendation.implementation_timeline && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                        <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                          <ClockIcon className="h-5 w-5 mr-2" />
                          Implementation Timeline
                        </h3>
                        <p className="text-blue-700 text-sm">{recommendation.implementation_timeline}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No success metrics defined.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Feedback Section */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback</h3>
            {recommendation.feedback_rating ? (
              <div>
                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star: number) => (
                    <StarIconSolid
                      key={star}
                      className={`h-5 w-5 ${
                        star <= recommendation.feedback_rating!
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {recommendation.feedback_rating}/5
                  </span>
                </div>
                {recommendation.feedback_comments && (
                  <p className="text-sm text-gray-600 mt-2">"{recommendation.feedback_comments}"</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">No feedback provided yet</p>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="btn-primary w-full"
                >
                  Rate This Recommendation
                </button>
              </div>
            )}
          </div>

          {/* Analysis Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Analysis Type</dt>
                <dd className="text-sm text-gray-900 mt-1 capitalize">{recommendation.analysis_type}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Confidence Score</dt>
                <dd className="text-sm text-gray-900 mt-1">{Math.round(recommendation.confidence_score * 100)}%</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(recommendation.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Document Status</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {recommendation.document_generated ? (
                    <span className="text-green-600">Generated</span>
                  ) : (
                    <span className="text-gray-500">Not generated</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/projects/${recommendation.project_id}`}
                className="w-full btn-secondary text-center block"
              >
                View Project
              </Link>
              <Link
                href={`/dashboard/recommendations?project=${recommendation.project_id}`}
                className="w-full btn-secondary text-center block"
              >
                Other Recommendations
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Provide Feedback</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you rate this recommendation?
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star: number) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="focus:outline-none"
                  >
                    <StarIconSolid
                      className={`h-8 w-8 ${
                        star <= feedbackRating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Share your thoughts about this recommendation..."
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSubmitFeedback}
                disabled={submitFeedbackMutation.isLoading || feedbackRating === 0}
                className="flex-1 btn-primary"
              >
                {submitFeedbackMutation.isLoading ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackRating(0);
                  setFeedbackComments('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}