'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'next/navigation';
import { recommendationAPI, projectAPI } from '@/lib/api';
import Link from 'next/link';
import {
  LightBulbIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  StarIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  FolderIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

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
}

interface Project {
  id: number;
  title: string;
  status: string;
}

export default function RecommendationsPage() {
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get('project');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(projectFilter || '');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch recommendations
  const { data: recommendationsData, isLoading } = useQuery(
    ['recommendations', currentPage, searchQuery, selectedProject, selectedType, sortBy],
    () => recommendationAPI.getAll({
      page: currentPage,
      search: searchQuery,
      project_id: selectedProject,
      analysis_type: selectedType,
      sort: sortBy
    }),
    {
      keepPreviousData: true
    }
  );

  // Fetch projects for filter
  const { data: projectsData } = useQuery('projects-list', projectAPI.getAll);

  const recommendations = recommendationsData?.data?.data || [];
  const pagination = recommendationsData?.data?.pagination;
  const projects = projectsData?.data || [];

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case 'quick': return 'bg-blue-100 text-blue-800';
      case 'enhanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleExport = async (recommendationId: number) => {
    // Implementation for document export would go here
    console.log('Export recommendation', recommendationId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Recommendations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Cultural wisdom insights and strategic recommendations for your projects
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/projects" className="btn-secondary flex items-center space-x-2">
            <FolderIcon className="h-5 w-5" />
            <span>Manage Projects</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recommendations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map((project: Project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="quick">Quick Analysis</option>
                <option value="enhanced">Enhanced Analysis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="confidence">Highest Confidence</option>
                <option value="rating">Best Rating</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading recommendations...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <LightBulbIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedProject || selectedType
                ? 'Try adjusting your search criteria'
                : 'Start by creating a project and generating your first recommendation'}
            </p>
            <Link href="/dashboard/projects" className="btn-primary">
              Manage Projects
            </Link>
          </div>
        ) : (
          recommendations.map((rec: Recommendation) => (
            <div key={rec.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{rec.title}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAnalysisTypeColor(rec.analysis_type)}`}>
                      {rec.analysis_type === 'quick' ? 'Quick Analysis' : 'Enhanced Analysis'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <Link
                      href={`/dashboard/projects/${rec.project_id}`}
                      className="flex items-center hover:text-blue-600"
                    >
                      <FolderIcon className="h-4 w-4 mr-1" />
                      {rec.project_title}
                    </Link>
                    
                    <div className={`flex items-center ${getConfidenceColor(rec.confidence_score)}`}>
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      {Math.round(rec.confidence_score * 100)}% Confidence
                    </div>
                    
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(rec.created_at).toLocaleDateString()}
                    </div>
                    
                    {rec.feedback_rating && (
                      <div className="flex items-center text-yellow-600">
                        <StarIcon className="h-4 w-4 mr-1" />
                        {rec.feedback_rating}/5
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/dashboard/recommendations/${rec.id}`}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  
                  {rec.document_generated && (
                    <button
                      onClick={() => handleExport(rec.id)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Export Document"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Key Insights Preview */}
              {rec.key_insights && rec.key_insights.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Key Insights:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.key_insights.slice(0, 3).map((insight, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {insight}
                      </li>
                    ))}
                    {rec.key_insights.length > 3 && (
                      <li className="text-blue-600 ml-3">
                        + {rec.key_insights.length - 3} more insights
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Cultural Considerations Preview */}
              {rec.cultural_considerations && rec.cultural_considerations.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Cultural Considerations:</h3>
                  <div className="flex flex-wrap gap-2">
                    {rec.cultural_considerations.slice(0, 4).map((consideration, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                      >
                        {consideration}
                      </span>
                    ))}
                    {rec.cultural_considerations.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{rec.cultural_considerations.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Implementation Timeline */}
              {rec.implementation_timeline && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Implementation Timeline:</h3>
                  <p className="text-sm text-gray-600">{rec.implementation_timeline}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {rec.recommendations && (
                    <span>{rec.recommendations.length} recommendations</span>
                  )}
                  {rec.potential_risks && (
                    <span>{rec.potential_risks.length} risks identified</span>
                  )}
                  {rec.success_metrics && (
                    <span>{rec.success_metrics.length} success metrics</span>
                  )}
                </div>
                
                <Link
                  href={`/dashboard/recommendations/${rec.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View Full Analysis →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}