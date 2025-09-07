'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  BeakerIcon, 
  CpuChipIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface KnowledgeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysisType: 'quick' | 'enhanced', costConfirmed: boolean) => Promise<void>;
  estimatedCost?: number;
  isProcessing: boolean;
  documentName?: string;
  extractedText?: string;
}

const analysisOptions = [
  {
    type: 'quick' as const,
    title: 'Quick Analysis',
    subtitle: 'TensorFlow.js + Local OCR',
    icon: CpuChipIcon,
    description: 'Fast, local analysis combining OCR text extraction with machine learning models',
    features: [
      'Local OCR text extraction',
      'Basic cultural pattern recognition',
      'Immediate categorization',
      'Privacy-focused (no data sent to servers)',
      'Perfect for routine knowledge entries'
    ],
    cost: 'Free',
    time: '5-15 seconds',
    accuracy: 'Good for basic categorization',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  },
  {
    type: 'enhanced' as const,
    title: 'Enhanced Analysis',
    subtitle: 'OCR + Advanced AI Analysis',
    icon: BeakerIcon,
    description: 'Deep cultural analysis using state-of-the-art OCR and language models with extensive cultural knowledge',
    features: [
      'High-accuracy OCR with context understanding',
      'Deep cultural significance analysis',
      'Traditional practice identification',
      'Comprehensive risk and opportunity assessment',
      'Historical context and anthropological insights'
    ],
    cost: '$0.02-0.15 per document',
    time: '15-45 seconds',
    accuracy: 'Excellent with cultural context',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  }
];

export default function KnowledgeAnalysisModal({
  isOpen,
  onClose,
  onSelectAnalysis,
  estimatedCost = 0.08,
  isProcessing,
  documentName,
  extractedText
}: KnowledgeAnalysisModalProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<'quick' | 'enhanced' | null>(null);
  const [costConfirmed, setCostConfirmed] = useState(false);
  const [showCostWarning, setShowCostWarning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleAnalysisSelect = (type: 'quick' | 'enhanced') => {
    setSelectedAnalysis(type);
    
    if (type === 'enhanced') {
      setShowCostWarning(true);
    } else {
      // For quick analysis, proceed immediately
      onSelectAnalysis(type, true);
    }
  };

  const handleEnhancedConfirm = () => {
    if (!costConfirmed) return;
    onSelectAnalysis('enhanced', costConfirmed);
  };

  const resetModal = () => {
    setSelectedAnalysis(null);
    setCostConfirmed(false);
    setShowCostWarning(false);
    setShowPreview(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              Knowledge Analysis Options
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Choose how to extract and analyze cultural knowledge from your content
            </p>
            {documentName && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                Document: {documentName}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {extractedText && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-gray-400 hover:text-gray-600 text-sm flex items-center"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                {showPreview ? 'Hide' : 'Preview'}
              </button>
            )}
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Preview extracted text */}
          {showPreview && extractedText && (
            <div className="mb-6 bg-gray-50 border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Text Preview:</h4>
              <div className="max-h-32 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
                {extractedText.substring(0, 500)}
                {extractedText.length > 500 && '...'}
              </div>
            </div>
          )}

          {!showCostWarning ? (
            // Analysis Options Selection
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysisOptions.map((option) => (
                <div
                  key={option.type}
                  className={`relative rounded-lg border-2 ${option.borderColor} ${option.bgColor} p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedAnalysis === option.type ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isProcessing && handleAnalysisSelect(option.type)}
                >
                  <div className="flex items-center mb-4">
                    <option.icon className={`h-8 w-8 ${option.iconColor} mr-3`} />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{option.title}</h4>
                      <p className="text-sm text-gray-600">{option.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{option.description}</p>
                  
                  <ul className="space-y-2 mb-4">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Cost:</span>
                      <span className="text-gray-600">{option.cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Time:</span>
                      <span className="text-gray-600">{option.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Accuracy:</span>
                      <span className="text-gray-600">{option.accuracy}</span>
                    </div>
                  </div>
                  
                  <button
                    disabled={isProcessing}
                    className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center ${option.buttonColor}`}
                  >
                    {isProcessing && selectedAnalysis === option.type ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Select {option.title}
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Cost Warning for Enhanced Analysis
            <div className="max-w-3xl mx-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-8 w-8 text-amber-600 mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2">
                      Enhanced Knowledge Analysis Cost Notice
                    </h4>
                    <p className="text-amber-700 mb-4">
                      Enhanced analysis uses advanced AI services (OpenRouter API) for high-quality OCR and 
                      deep cultural analysis. This provides superior accuracy but incurs a small cost.
                    </p>
                    
                    <div className="bg-white rounded-lg border border-amber-200 p-4 mb-4">
                      <h5 className="font-medium text-gray-900 mb-3">What You Get for ${estimatedCost.toFixed(3)}:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h6 className="font-medium text-gray-800 mb-2">OCR & Extraction:</h6>
                          <ul className="space-y-1 text-gray-600">
                            <li>• High-accuracy text extraction</li>
                            <li>• Context-aware formatting</li>
                            <li>• Multi-language support</li>
                            <li>• Handwriting recognition</li>
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-medium text-gray-800 mb-2">Cultural Analysis:</h6>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Deep cultural significance</li>
                            <li>• Traditional practice identification</li>
                            <li>• Historical context analysis</li>
                            <li>• Risk and opportunity assessment</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 mb-4">
                      <CurrencyDollarIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-700">
                        <strong>Why the cost?</strong>
                        <p>Enhanced analysis uses cutting-edge AI models that can understand cultural nuances, 
                        historical contexts, and provide insights that basic OCR cannot match.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-700">
                        <strong>Processing time:</strong>
                        <p>15-45 seconds depending on document complexity. The system will extract text, 
                        analyze cultural significance, and provide detailed insights.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={costConfirmed}
                    onChange={(e) => setCostConfirmed(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I understand that enhanced analysis will incur a cost of approximately <strong>${estimatedCost.toFixed(3)}</strong> 
                    and will provide high-quality OCR extraction plus deep cultural analysis. I wish to proceed.
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCostWarning(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Back to Options
                </button>
                <button
                  onClick={handleEnhancedConfirm}
                  disabled={!costConfirmed || isProcessing}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Proceed with Enhanced Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}