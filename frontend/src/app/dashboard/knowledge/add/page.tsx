'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'react-query';
import { knowledgeAPI } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  LinkIcon,
  FolderIcon,
  CloudArrowUpIcon,
  PlusIcon,
  XMarkIcon,
  TagIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface KnowledgeFormData {
  title: string;
  source_type: 'text' | 'url' | 'document';
  source_url?: string;
  content_text?: string;
  file?: File;
  category_id?: number;
  tags: string[];
  cultural_context?: string;
  importance_score: number;
}

const CULTURAL_CONTEXTS = [
  'Religious Customs & Practices',
  'Traditional Ceremonies & Festivals',
  'Local Leadership Structures',
  'Community Decision Making',
  'Economic & Trade Practices',
  'Family & Social Dynamics',
  'Communication Patterns',
  'Conflict Resolution Methods',
  'Agricultural Traditions',
  'Educational Approaches',
  'Healthcare Beliefs',
  'Environmental Stewardship'
];

export default function AddKnowledgePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<KnowledgeFormData>({
    title: '',
    source_type: 'text',
    content_text: '',
    category_id: undefined,
    tags: [],
    cultural_context: '',
    importance_score: 0.5
  });
  const [newTag, setNewTag] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Fetch categories
  const { data: categoriesData } = useQuery('knowledge-categories', knowledgeAPI.getCategories);
  const categories = categoriesData?.data?.data || [];

  // Add knowledge mutation
  const addKnowledgeMutation = useMutation(knowledgeAPI.addDirectEntry, {
    onSuccess: () => {
      toast.success('Knowledge entry added successfully!');
      router.push('/dashboard/knowledge');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add knowledge entry');
    }
  });

  const handleInputChange = (field: keyof KnowledgeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (file: File) => {
    setFormData(prev => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, '')
    }));
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (allowedTypes.includes(file.type)) {
        handleFileSelect(file);
      } else {
        toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (formData.source_type === 'text' && !formData.content_text?.trim()) {
      toast.error('Content text is required');
      return;
    }

    if (formData.source_type === 'url' && !formData.source_url?.trim()) {
      toast.error('URL is required');
      return;
    }

    if (formData.source_type === 'document' && !formData.file) {
      toast.error('Document file is required');
      return;
    }

    // Prepare submission data
    let submitData: any = {
      title: formData.title.trim(),
      source_type: formData.source_type,
      category_id: formData.category_id,
      tags: formData.tags,
      cultural_context: formData.cultural_context?.trim(),
      importance_score: formData.importance_score
    };

    if (formData.source_type === 'text') {
      submitData.content_text = formData.content_text;
    } else if (formData.source_type === 'url') {
      submitData.source_url = formData.source_url;
    }

    // Handle file upload
    if (formData.file) {
      const formDataSubmit = new FormData();
      Object.keys(submitData).forEach(key => {
        if (key === 'tags') {
          formDataSubmit.append(key, JSON.stringify(submitData[key]));
        } else if (submitData[key] !== undefined && submitData[key] !== null) {
          formDataSubmit.append(key, submitData[key].toString());
        }
      });
      formDataSubmit.append('file', formData.file);
      submitData = formDataSubmit;
    }

    addKnowledgeMutation.mutate(submitData);
  };

  const getSourceTypeIcon = () => {
    switch (formData.source_type) {
      case 'text': return DocumentTextIcon;
      case 'url': return LinkIcon;
      case 'document': return FolderIcon;
      default: return DocumentTextIcon;
    }
  };

  const SourceIcon = getSourceTypeIcon();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard/knowledge"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Knowledge Entry</h1>
          <p className="text-sm text-gray-600">
            Contribute to the cultural wisdom knowledge base for Sampang region
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Source Type Selection */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Knowledge Source Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                type: 'text', 
                label: 'Text Entry', 
                description: 'Direct text input of cultural knowledge',
                icon: DocumentTextIcon
              },
              { 
                type: 'url', 
                label: 'Website/URL', 
                description: 'Link to online resources or articles',
                icon: LinkIcon
              },
              { 
                type: 'document', 
                label: 'Document Upload', 
                description: 'PDF, DOC, or other document files',
                icon: FolderIcon
              }
            ].map((option) => {
              const Icon = option.icon;
              return (
                <label
                  key={option.type}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.source_type === option.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="source_type"
                    value={option.type}
                    checked={formData.source_type === option.type}
                    onChange={(e) => handleInputChange('source_type', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center text-center">
                    <Icon className={`h-8 w-8 mb-2 ${
                      formData.source_type === option.type ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <h3 className="font-medium text-gray-900 mb-1">{option.label}</h3>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Title *
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Enter a descriptive title for this knowledge entry"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">
                Category
              </label>
              <select
                className="form-input"
                value={formData.category_id || ''}
                onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">Select a category (optional)</option>
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Source Content */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <SourceIcon className="h-6 w-6 mr-2" />
            Source Content
          </h2>
          
          {formData.source_type === 'text' && (
            <div>
              <label className="form-label">
                Content Text *
              </label>
              <textarea
                required
                rows={8}
                className="form-input"
                placeholder="Enter the cultural knowledge content here. Be as detailed and specific as possible about cultural practices, traditions, customs, or wisdom relevant to the Sampang region..."
                value={formData.content_text || ''}
                onChange={(e) => handleInputChange('content_text', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Tip: Include specific examples, context, and practical applications where possible.
              </p>
            </div>
          )}

          {formData.source_type === 'url' && (
            <div>
              <label className="form-label">
                Website URL *
              </label>
              <input
                type="url"
                required
                className="form-input"
                placeholder="https://example.com/cultural-article"
                value={formData.source_url || ''}
                onChange={(e) => handleInputChange('source_url', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                The system will automatically extract relevant content from the provided URL.
              </p>
            </div>
          )}

          {formData.source_type === 'document' && (
            <div>
              <label className="form-label">
                Document Upload *
              </label>
              
              {!formData.file ? (
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Drop your document here
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to browse files
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="btn-primary cursor-pointer">
                    Choose File
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FolderIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{formData.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('file', undefined)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cultural Context & Metadata */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cultural Context & Metadata</h2>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">
                Cultural Context
              </label>
              <select
                className="form-input"
                value={formData.cultural_context || ''}
                onChange={(e) => handleInputChange('cultural_context', e.target.value)}
              >
                <option value="">Select cultural context (optional)</option>
                {CULTURAL_CONTEXTS.map(context => (
                  <option key={context} value={context}>
                    {context}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">
                Importance Score
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="flex-1"
                  value={formData.importance_score}
                  onChange={(e) => handleInputChange('importance_score', parseFloat(e.target.value))}
                />
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">{Math.round(formData.importance_score * 100)}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                How important is this knowledge for cultural understanding and project success?
              </p>
            </div>

            <div>
              <label className="form-label">
                Tags
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 form-input"
                    placeholder="Enter a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <TagIcon className="h-3 w-3" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-600 hover:text-blue-700 ml-1"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Add relevant tags to help categorize and search for this knowledge entry.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={addKnowledgeMutation.isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            {addKnowledgeMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <DocumentTextIcon className="h-4 w-4" />
                <span>Add Knowledge Entry</span>
              </>
            )}
          </button>
          
          <Link href="/dashboard/knowledge" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}