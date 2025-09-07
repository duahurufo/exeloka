'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { projectAPI } from '@/lib/api';
import Link from 'next/link';
import {
  PlusIcon,
  FolderIcon,
  ClockIcon,
  LightBulbIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import AnalysisOptionsModal from '@/components/dashboard/AnalysisOptionsModal';
import { useRouter } from 'next/navigation';

interface Project {
  id: number;
  title: string;
  description: string;
  project_type?: string;
  status: 'planning' | 'analyzing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  recommendation_count: number;
}

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const router = useRouter();

  const { data: projectsData, isLoading, refetch } = useQuery<{data: Project[]}>('projects', 
    () => projectAPI.getAll()
  );

  const projects = projectsData?.data || [];

  const handleGenerateRecommendation = (project: Project) => {
    setSelectedProject(project);
    setAnalysisModalOpen(true);
  };

  const handleAnalysisComplete = (recommendation: any) => {
    refetch(); // Refresh projects list
    router.push(`/dashboard/recommendations/${recommendation.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'analyzing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return ClockIcon;
      case 'analyzing': return LightBulbIcon;
      case 'completed': return ChartBarIcon;
      default: return FolderIcon;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your cultural engagement projects and generate AI-powered recommendations.
          </p>
        </div>
        <Link href="/dashboard/projects/new" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first project to start generating cultural wisdom recommendations.
          </p>
          <Link href="/dashboard/projects/new" className="btn-primary">
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const StatusIcon = getStatusIcon(project.status);
            
            return (
              <div key={project.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <StatusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{project.project_type || 'General'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    <button className="text-gray-400 hover:text-gray-500">
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  <span>{project.recommendation_count} recommendations</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="btn-secondary flex-1 text-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleGenerateRecommendation(project)}
                    className="btn-primary flex items-center px-3"
                    title="Generate Recommendation"
                  >
                    <LightBulbIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analysis Options Modal */}
      {selectedProject && (
        <AnalysisOptionsModal
          isOpen={analysisModalOpen}
          onClose={() => {
            setAnalysisModalOpen(false);
            setSelectedProject(null);
          }}
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </div>
  );
}