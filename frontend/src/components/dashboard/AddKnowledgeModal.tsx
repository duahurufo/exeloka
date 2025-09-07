'use client';

import { useState, useRef } from 'react';
import { XMarkIcon, DocumentTextIcon, LinkIcon, PlusIcon } from '@heroicons/react/24/outline';
import KnowledgeAnalysisModal from './KnowledgeAnalysisModal';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (knowledge: KnowledgeEntry) => Promise<void>;
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

const WISDOM_CATEGORIES = [
  { id: 1, name: 'Adat Istiadat', description: 'Traditional customs and practices' },
  { id: 2, name: 'Kepercayaan', description: 'Beliefs and spiritual practices' },
  { id: 3, name: 'Ekonomi Lokal', description: 'Local economic systems and practices' },
  { id: 4, name: 'Lingkungan', description: 'Environmental knowledge and practices' },
  { id: 5, name: 'Sosial Kemasyarakatan', description: 'Social community structures' },
  { id: 6, name: 'Bahasa dan Komunikasi', description: 'Language and communication patterns' },
  { id: 7, name: 'Seni dan Budaya', description: 'Arts and cultural expressions' },
  { id: 8, name: 'Sejarah Lokal', description: 'Local historical knowledge' }
];

export default function AddKnowledgeModal({ isOpen, onClose, onAdd }: AddKnowledgeModalProps) {
  const [formData, setFormData] = useState<KnowledgeEntry>({
    title: '',
    source_type: 'text',
    content_text: '',
    source_url: '',
    category_id: undefined,
    tags: [],
    cultural_context: '',
    importance_score: 0.5
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessingAnalysis, setIsProcessingAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      source_type: 'text',
      content_text: '',
      source_url: '',
      category_id: undefined,
      tags: [],
      cultural_context: '',
      importance_score: 0.5
    });
    setTagInput('');
    setShowAnalysisModal(false);
    setExtractedText('');
    setIsProcessingAnalysis(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '') // Use filename as title if empty
      }));
    }
  };

  const extractContent = async (): Promise<string> => {
    if (formData.source_type === 'text') {
      return formData.content_text || '';
    } else if (formData.source_type === 'url') {
      // For URLs, we'll return the URL itself for now
      // In a real implementation, this would fetch and process the content
      return formData.source_url || '';
    } else if (formData.source_type === 'document' && formData.file) {
      // Check if it's an image file that needs OCR
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.webp'];
      const fileExtension = formData.file.name.split('.').pop()?.toLowerCase();
      
      if (imageExtensions.includes(`.${fileExtension}`)) {
        // Use OCR for image files
        const formDataToSend = new FormData();
        formDataToSend.append('file', formData.file);
        formDataToSend.append('language', 'eng+ind');
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ocr/extract`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
        
        if (!response.ok) {
          throw new Error('OCR extraction failed');
        }
        
        const result = await response.json();
        return result.data.text;
      } else {
        // For non-image documents (PDF, DOC, etc.), return filename for now
        // This would be processed by the backend document processor
        return `Document: ${formData.file.name}`;
      }
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (formData.source_type === 'text' && !formData.content_text?.trim()) {
      alert('Please enter content text');
      return;
    }

    if (formData.source_type === 'url' && !formData.source_url?.trim()) {
      alert('Please enter a URL');
      return;
    }

    if (formData.source_type === 'document' && !formData.file) {
      alert('Please select a file');
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract content using OCR
      const extracted = await extractContent();
      setExtractedText(extracted);
      
      // Show analysis modal
      setShowAnalysisModal(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error extracting content:', error);
      alert('Failed to extract content. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleAnalysisComplete = async (analysisType: 'quick' | 'enhanced', costConfirmed: boolean) => {
    setIsProcessingAnalysis(true);
    try {
      // TODO: Implement analysis logic based on type
      console.log('Analysis type:', analysisType, 'Cost confirmed:', costConfirmed);
      
      // For now, just add the knowledge with extracted text
      const enhancedFormData = {
        ...formData,
        content_text: extractedText || formData.content_text
      };
      
      await onAdd(enhancedFormData);
      handleClose();
    } catch (error) {
      console.error('Error during analysis:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsProcessingAnalysis(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Knowledge Entry</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Source Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Source Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'text', label: 'Text Entry', icon: DocumentTextIcon },
                { value: 'url', label: 'URL/Website', icon: LinkIcon },
                { value: 'document', label: 'Document', icon: DocumentTextIcon }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, source_type: value as any }))}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                    formData.source_type === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a descriptive title"
              required
            />
          </div>

          {/* Content based on source type */}
          {formData.source_type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the knowledge content, cultural practices, wisdom, etc."
                required
              />
            </div>
          )}

          {formData.source_type === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL *
              </label>
              <input
                type="url"
                value={formData.source_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/article"
                required
              />
            </div>
          )}

          {formData.source_type === 'document' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, TXT
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                category_id: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category (optional)</option>
              {WISDOM_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} - {category.description}
                </option>
              ))}
            </select>
          </div>

          {/* Cultural Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cultural Context
            </label>
            <textarea
              value={formData.cultural_context || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, cultural_context: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the cultural significance, context, or relevance to Sampang community"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add tags (press Enter to add)"
              />
              <button
                type="button"
                onClick={handleTagAdd}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Importance Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importance Score: {Math.round((formData.importance_score || 0.5) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.importance_score || 0.5}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                importance_score: parseFloat(e.target.value) 
              }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Less Important</span>
              <span>Very Important</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Knowledge'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Knowledge Analysis Modal */}
      <KnowledgeAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        onSelectAnalysis={handleAnalysisComplete}
        isProcessing={isProcessingAnalysis}
        documentName={formData.file?.name || formData.title}
        extractedText={extractedText}
      />
    </div>
  );
}