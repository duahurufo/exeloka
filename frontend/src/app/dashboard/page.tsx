'use client';

import { useQuery } from 'react-query';
import { projectAPI, learningAPI } from '@/lib/api';
import {
  FolderIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
  projects: {
    total_projects: number;
    completed_projects: number;
    planning_projects: number;
    analyzing_projects: number;
  };
  recommendations: {
    total_recommendations: number;
    avg_confidence_score: number;
    feedback_count: number;
    avg_rating: number;
  };
  recent_activity: Array<{
    project_title: string;
    recommendation_title: string;
    confidence_score: number;
    created_at: string;
    feedback_rating?: number;
  }>;
}

interface LearningStats {
  overall: {
    total_feedback: number;
    average_rating: number;
    implementation_success_rate: number;
    total_learning_insights: number;
  };
}

export default function DashboardPage() {
  const { data: analytics } = useQuery<{ data: DashboardStats }>('analytics', 
    () => projectAPI.getAnalytics()
  );

  const { data: learningStats } = useQuery<{ data: LearningStats }>('learning-stats',
    () => learningAPI.getStats()
  );

  const stats = analytics?.data;
  const learning = learningStats?.data;

  const quickStats = [
    {
      name: 'Active Projects',
      value: stats?.projects.total_projects || 0,
      icon: FolderIcon,
      color: 'bg-blue-500',
      href: '/dashboard/projects'
    },
    {
      name: 'Recommendations',
      value: stats?.recommendations.total_recommendations || 0,
      icon: LightBulbIcon,
      color: 'bg-green-500',
      href: '/dashboard/recommendations'
    },
    {
      name: 'Success Rate',
      value: `${Math.round((learning?.overall.implementation_success_rate || 0) * 100)}%`,
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500',
      href: '/dashboard/analytics'
    },
    {
      name: 'Avg Rating',
      value: `${(learning?.overall.average_rating || 0).toFixed(1)}★`,
      icon: StarIcon,
      color: 'bg-yellow-500',
      href: '/dashboard/learning'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome back! Here's an overview of your cultural engagement projects.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <div className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Project Status */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
            <Link href="/dashboard/projects" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              View all
            </Link>
          </div>

          {stats?.projects ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Planning Phase</span>
                <span className="text-sm font-medium">{stats.projects.planning_projects}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${(stats.projects.planning_projects / Math.max(stats.projects.total_projects, 1)) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Analyzing</span>
                <span className="text-sm font-medium">{stats.projects.analyzing_projects}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.projects.analyzing_projects / Math.max(stats.projects.total_projects, 1)) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium">{stats.projects.completed_projects}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(stats.projects.completed_projects / Math.max(stats.projects.total_projects, 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No projects yet</p>
              <Link href="/dashboard/projects/new" className="btn-primary mt-4 inline-block">
                Create Your First Project
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/projects/new" className="w-full btn-primary text-center block">
              New Project
            </Link>
            <Link href="/dashboard/knowledge/add" className="w-full btn-secondary text-center block">
              Add Knowledge
            </Link>
            <Link href="/dashboard/recommendations" className="w-full btn-secondary text-center block">
              View Recommendations
            </Link>
            <Link href="/dashboard/analytics" className="w-full btn-secondary text-center block">
              Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/dashboard/recommendations" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
            View all
          </Link>
        </div>

        {stats?.recent_activity && stats.recent_activity.length > 0 ? (
          <div className="space-y-4">
            {stats.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <LightBulbIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.recommendation_title}</p>
                    <p className="text-xs text-gray-500">{activity.project_title}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    {Math.round(activity.confidence_score * 100)}%
                  </div>
                  {activity.feedback_rating && (
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 mr-1" />
                      {activity.feedback_rating}
                    </div>
                  )}
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">System Learning Status</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{learning?.overall.total_feedback || 0}</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{learning?.overall.total_learning_insights || 0}</div>
            <div className="text-sm text-gray-600">Learning Insights</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((learning?.overall.implementation_success_rate || 0) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}