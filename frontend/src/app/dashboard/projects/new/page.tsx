'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'react-query';
import { projectAPI } from '@/lib/api';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ProjectFormData {
  title: string;
  description: string;
  project_type: string;
  target_audience: string;
  cultural_context: string;
  objectives: string[];
  priority_areas: string[];
  timeline: string;
  budget_range: string;
  stakeholders: string[];
}

const PROJECT_TYPES = [
  { value: 'infrastructure', label: 'Infrastructure Development' },
  { value: 'business', label: 'Business Expansion' },
  { value: 'community', label: 'Community Engagement' },
  { value: 'cultural', label: 'Cultural Initiative' },
  { value: 'education', label: 'Education & Training' },
  { value: 'tourism', label: 'Tourism Development' },
  { value: 'agriculture', label: 'Agricultural Project' },
  { value: 'technology', label: 'Technology Implementation' }
];

const PRIORITY_AREAS = [
  'Religious Customs',
  'Traditional Ceremonies',
  'Local Leadership',
  'Community Values',
  'Economic Practices',
  'Social Dynamics',
  'Family Structures',
  'Communication Styles',
  'Conflict Resolution',
  'Decision Making Process'
];

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    project_type: '',
    target_audience: '',
    cultural_context: '',
    objectives: [''],
    priority_areas: [],
    timeline: '',
    budget_range: '',
    stakeholders: ['']
  });

  const createProjectMutation = useMutation(projectAPI.create, {
    onSuccess: (response) => {
      toast.success('Project created successfully!');
      router.push(`/dashboard/projects/${response.data.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  });

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'objectives' | 'stakeholders', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'objectives' | 'stakeholders') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'objectives' | 'stakeholders', index: number) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newArray }));
    }
  };

  const handlePriorityAreaToggle = (area: string) => {
    setFormData(prev => ({
      ...prev,
      priority_areas: prev.priority_areas.includes(area)
        ? prev.priority_areas.filter(a => a !== area)
        : [...prev.priority_areas, area]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Project description is required');
      return;
    }
    if (!formData.project_type) {
      toast.error('Project type is required');
      return;
    }

    const cleanData = {
      ...formData,
      objectives: formData.objectives.filter(obj => obj.trim()),
      stakeholders: formData.stakeholders.filter(stakeholder => stakeholder.trim())
    };

    createProjectMutation.mutate(cleanData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/projects"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
          <p className="text-sm text-gray-600">
            Create a new cultural engagement project for the Sampang region
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="form-label">
                Project Title *
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Enter project title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">
                Project Type *
              </label>
              <select
                required
                className="form-input"
                value={formData.project_type}
                onChange={(e) => handleInputChange('project_type', e.target.value)}
              >
                <option value="">Select project type</option>
                {PROJECT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Timeline
              </label>
              <select
                className="form-input"
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
              >
                <option value="">Select timeline</option>
                <option value="1-3 months">1-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="6-12 months">6-12 months</option>
                <option value="1-2 years">1-2 years</option>
                <option value="2+ years">2+ years</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="form-label">
                Project Description *
              </label>
              <textarea
                required
                rows={4}
                className="form-input"
                placeholder="Describe your project goals, scope, and expected outcomes..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">
                Target Audience
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Local farmers, Urban residents"
                value={formData.target_audience}
                onChange={(e) => handleInputChange('target_audience', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">
                Budget Range
              </label>
              <select
                className="form-input"
                value={formData.budget_range}
                onChange={(e) => handleInputChange('budget_range', e.target.value)}
              >
                <option value="">Select budget range</option>
                <option value="< 100M IDR">&lt; 100M IDR</option>
                <option value="100M - 500M IDR">100M - 500M IDR</option>
                <option value="500M - 1B IDR">500M - 1B IDR</option>
                <option value="1B - 5B IDR">1B - 5B IDR</option>
                <option value="5B+ IDR">5B+ IDR</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cultural Context</h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Cultural Context &amp; Considerations
              </label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Describe any cultural considerations, local customs, or sensitive areas that should be considered..."
                value={formData.cultural_context}
                onChange={(e) => handleInputChange('cultural_context', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">
                Priority Cultural Areas
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Select areas that are most important for your project success
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PRIORITY_AREAS.map(area => (
                  <label key={area} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.priority_areas.includes(area)}
                      onChange={() => handlePriorityAreaToggle(area)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{area}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Objectives</h2>
          
          <div className="space-y-3">
            {formData.objectives.map((objective, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-1 form-input"
                  placeholder={`Objective ${index + 1}`}
                  value={objective}
                  onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                />
                {formData.objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('objectives', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('objectives')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Objective</span>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Stakeholders</h2>
          
          <div className="space-y-3">
            {formData.stakeholders.map((stakeholder, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-1 form-input"
                  placeholder={`Stakeholder ${index + 1} (e.g., Village Head, Religious Leader)`}
                  value={stakeholder}
                  onChange={(e) => handleArrayChange('stakeholders', index, e.target.value)}
                />
                {formData.stakeholders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('stakeholders', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('stakeholders')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Stakeholder</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={createProjectMutation.isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            {createProjectMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <DocumentTextIcon className="h-4 w-4" />
                <span>Create Project</span>
              </>
            )}
          </button>
          
          <Link href="/dashboard/projects" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}