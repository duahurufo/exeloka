'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectAPI, recommendationAPI } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import AnalysisOptionsModal from '@/components/dashboard/AnalysisOptionsModal';
import toast from 'react-hot-toast';

interface Project {
  id: number;
  title: string;
  description: string;
  project_type?: string;
  target_audience?: string;
  cultural_context?: string;
  objectives?: string[];
  priority_areas?: string[];
  timeline?: string;
  budget_range?: string;
  stakeholders?: string[];
  status: 'planning' | 'analyzing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by_name: string;
  created_by_email: string;
}

interface Recommendation {
  id: number;
  title: string;
  analysis_type: string;
  confidence_score: number;
  key_insights: string[];
  recommendations: string[];
  potential_risks: string[];
  success_metrics: string[];
  implementation_timeline: string;
  cultural_considerations: string[];
  created_at: string;
  feedback_rating?: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch project details
  const { data: projectData, isLoading } = useQuery(
    ['project', projectId],
    () => projectAPI.getById(projectId),
    {
      enabled: !!projectId
    }
  );

  // Fetch project recommendations
  const { data: recommendationsData } = useQuery(
    ['project-recommendations', projectId],
    () => recommendationAPI.getByProject(projectId),
    {
      enabled: !!projectId
    }
  );

  // Delete project mutation
  const deleteProjectMutation = useMutation(
    () => projectAPI.delete(projectId),
    {
      onSuccess: () => {
        toast.success('Project deleted successfully');
        router.push('/dashboard/projects');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete project');
      }
    }
  );

  const project = projectData?.data?.data;
  const recommendations = recommendationsData?.data?.data || [];

  const handleAnalysisComplete = (recommendation: any) => {
    queryClient.invalidateQueries(['project-recommendations', projectId]);
    router.push(`/dashboard/recommendations/${recommendation.id}`);
  };

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'analyzing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return ClockIcon;
      case 'analyzing': return LightBulbIcon;
      case 'completed': return ChartBarIcon;
      default: return DocumentTextIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-600 mb-4">The requested project could not be found.</p>
        <Link href="/dashboard/projects" className="btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(project.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Link 
            href="/dashboard/projects"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600">{project.project_type || 'General Project'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAnalysisModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <LightBulbIcon className="h-5 w-5" />
            <span>Generate Analysis</span>
          </button>
          
          <Link
            href={`/dashboard/projects/${projectId}/edit`}
            className="btn-secondary flex items-center space-x-2"
          >
            <PencilIcon className="h-5 w-5" />
            <span>Edit</span>
          </Link>
          
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Description */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h2>
            <p className="text-gray-700 leading-relaxed">{project.description}</p>
          </div>

          {/* Cultural Context */}
          {project.cultural_context && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cultural Context</h2>
              <p className="text-gray-700 leading-relaxed">{project.cultural_context}</p>
            </div>
          )}

          {/* Priority Areas */}
          {project.priority_areas && project.priority_areas.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Cultural Areas</h2>
              <div className="flex flex-wrap gap-2">
                {project.priority_areas.map((area: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Objectives */}
          {project.objectives && project.objectives.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Objectives</h2>
              <ul className="space-y-2">
                {project.objectives.map((objective: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stakeholders */}
          {project.stakeholders && project.stakeholders.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Stakeholders</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {project.stakeholders.map((stakeholder: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{stakeholder}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
              <span className="text-sm text-gray-500">{recommendations.length} generated</span>
            </div>
            
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <LightBulbIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No recommendations generated yet</p>
                <button
                  onClick={() => setAnalysisModalOpen(true)}
                  className="btn-primary"
                >
                  Generate First Recommendation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec: Recommendation) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{rec.analysis_type} Analysis</span>
                          <div className="flex items-center">
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                            {Math.round(rec.confidence_score * 100)}% Confidence
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(rec.created_at).toLocaleDateString()}
                          </div>
                          {rec.feedback_rating && (
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                              {rec.feedback_rating}/5
                            </div>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/recommendations/${rec.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                    
                    {rec.key_insights && rec.key_insights.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.key_insights.slice(0, 3).map((insight, idx) => (
                            <li key={idx}>• {insight}</li>
                          ))}
                          {rec.key_insights.length > 3 && (
                            <li className="text-blue-600">+ {rec.key_insights.length - 3} more insights</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
            <dl className="space-y-3">
              {project.target_audience && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Target Audience</dt>
                  <dd className="text-sm text-gray-900 mt-1">{project.target_audience}</dd>
                </div>
              )}
              
              {project.timeline && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                  <dd className="text-sm text-gray-900 mt-1">{project.timeline}</dd>
                </div>
              )}
              
              {project.budget_range && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Budget Range</dt>
                  <dd className="text-sm text-gray-900 mt-1">{project.budget_range}</dd>
                </div>
              )}
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="text-sm text-gray-900 mt-1">{project.created_by_name}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(project.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(project.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setAnalysisModalOpen(true)}
                className="w-full btn-primary text-left"
              >
                Generate New Analysis
              </button>
              <Link
                href={`/dashboard/projects/${projectId}/edit`}
                className="w-full btn-secondary text-center block"
              >
                Edit Project
              </Link>
              {recommendations.length > 0 && (
                <Link
                  href={`/dashboard/recommendations?project=${projectId}`}
                  className="w-full btn-secondary text-center block"
                >
                  View All Recommendations
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Options Modal */}
      <AnalysisOptionsModal
        isOpen={analysisModalOpen}
        onClose={() => setAnalysisModalOpen(false)}
        projectId={projectId}
        projectTitle={project.title}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this project? This action cannot be undone and will also delete all associated recommendations.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProjectMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
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