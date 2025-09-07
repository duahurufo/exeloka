'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentTextIcon,
  LinkIcon,
  FolderIcon,
  TagIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import AddKnowledgeModal from '@/components/dashboard/AddKnowledgeModal';
import { knowledgeAPI } from '@/lib/api';

interface KnowledgeSource {
  id: number;
  title: string;
  source_type: 'url' | 'document' | 'text';
  source_url?: string;
  content_text?: string;
  metadata?: any;
  wisdom_entry_id?: number;
  category_id?: number;
  category_name?: string;
  importance_score?: number;
  tags?: string[];
  cultural_context?: string;
  processing_status: string;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
}

interface KnowledgeEntry {
  title: string;
  source_type: 'url' | 'document' | 'text';
  source_url?: string;
  content_text?: string;
  file?: File;
  category_id?: number;
  tags?: string[];
  cultural_context?: string;
  importance_score?: number;
}

interface Category {
  id: number;
  name: string;
  description: string;
  entry_count: number;
}

const SOURCE_TYPE_ICONS = {
  text: DocumentTextIcon,
  url: LinkIcon,
  document: FolderIcon
};

const SOURCE_TYPE_COLORS = {
  text: 'bg-blue-100 text-blue-800',
  url: 'bg-green-100 text-green-800', 
  document: 'bg-purple-100 text-purple-800'
};

export default function KnowledgePage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  // Fetch knowledge sources
  const { data: sourcesData, isLoading } = useQuery(
    ['knowledge-sources', currentPage, searchQuery, selectedCategory, selectedSourceType],
    () => knowledgeAPI.getSources({
      page: currentPage,
      search: searchQuery,
      category: selectedCategory,
      source_type: selectedSourceType
    }),
    {
      keepPreviousData: true
    }
  );

  // Fetch categories
  const { data: categoriesData } = useQuery('knowledge-categories', knowledgeAPI.getCategories);

  // Add knowledge entry mutation
  const addKnowledgeMutation = useMutation(knowledgeAPI.addDirectEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries('knowledge-sources');
      queryClient.invalidateQueries('knowledge-categories');
    }
  });

  const sources = sourcesData?.data?.data || [];
  const pagination = sourcesData?.data?.pagination;
  const categories = categoriesData?.data?.data || [];

  const handleAddKnowledge = async (knowledge: KnowledgeEntry) => {
    if (knowledge.file) {
      const formData = new FormData();
      formData.append('title', knowledge.title);
      formData.append('source_type', knowledge.source_type);
      if (knowledge.category_id) formData.append('category_id', knowledge.category_id.toString());
      if (knowledge.tags) formData.append('tags', JSON.stringify(knowledge.tags));
      if (knowledge.cultural_context) formData.append('cultural_context', knowledge.cultural_context);
      if (knowledge.importance_score) formData.append('importance_score', knowledge.importance_score.toString());
      formData.append('file', knowledge.file);
      
      await addKnowledgeMutation.mutateAsync(formData);
    } else {
      await addKnowledgeMutation.mutateAsync({
        title: knowledge.title,
        source_type: knowledge.source_type,
        source_url: knowledge.source_url,
        content_text: knowledge.content_text,
        category_id: knowledge.category_id,
        tags: knowledge.tags,
        cultural_context: knowledge.cultural_context,
        importance_score: knowledge.importance_score
      });
    }
  };

  const getSourceTypeIcon = (type: string) => {
    const Icon = SOURCE_TYPE_ICONS[type as keyof typeof SOURCE_TYPE_ICONS] || DocumentTextIcon;
    return Icon;
  };

  const getSourceTypeColor = (type: string) => {
    return SOURCE_TYPE_COLORS[type as keyof typeof SOURCE_TYPE_COLORS] || 'bg-gray-100 text-gray-800';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage cultural wisdom and knowledge sources for Sampang region
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Knowledge</span>
        </button>
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
                  placeholder="Search knowledge base..."
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.name}>
                    {category.name} ({category.entry_count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
              <select
                value={selectedSourceType}
                onChange={(e) => setSelectedSourceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="text">Text Entry</option>
                <option value="url">URL/Website</option>
                <option value="document">Document</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Knowledge Sources */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading knowledge sources...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No knowledge sources found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory || selectedSourceType 
                ? 'Try adjusting your search criteria' 
                : 'Start by adding your first knowledge entry'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              Add Knowledge
            </button>
          </div>
        ) : (
          sources.map((source: KnowledgeSource) => {
            const Icon = getSourceTypeIcon(source.source_type);
            return (
              <div key={source.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${getSourceTypeColor(source.source_type)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {source.title}
                        </h3>
                        
                        {source.cultural_context && (
                          <p className="text-sm text-gray-600 mb-2">
                            {source.cultural_context}
                          </p>
                        )}
                        
                        {source.content_text && (
                          <p className="text-sm text-gray-700 mb-3">
                            {source.content_text.length > 200 
                              ? `${source.content_text.substring(0, 200)}...`
                              : source.content_text
                            }
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {source.category_name && (
                            <div className="flex items-center">
                              <FolderIcon className="h-4 w-4 mr-1" />
                              {source.category_name}
                            </div>
                          )}
                          
                          {source.importance_score && (
                            <div className="flex items-center">
                              <span className="mr-1">Importance:</span>
                              <span className="font-medium">
                                {Math.round(source.importance_score * 100)}%
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {source.created_by_name}
                          </div>
                          
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(source.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {source.tags && source.tags.length > 0 && (
                          <div className="flex items-center space-x-2 mt-3">
                            <TagIcon className="h-4 w-4 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {source.tags.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          source.processing_status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : source.processing_status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : source.processing_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {source.processing_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
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

      {/* Add Knowledge Modal */}
      <AddKnowledgeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddKnowledge}
      />
    </div>
  );
}