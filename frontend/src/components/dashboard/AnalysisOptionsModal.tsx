'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  BoltIcon, 
  BeakerIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation } from 'react-query';
import { projectAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface AnalysisOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectTitle: string;
  onAnalysisComplete: (recommendation: any) => void;
}

interface PromptTemplates {
  system_instruction: string;
  user_prompt: string;
  recommended_usage: {
    system_instruction: string;
    user_prompt: string;
    placeholders: Record<string, string>;
  };
}

export default function AnalysisOptionsModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onAnalysisComplete
}: AnalysisOptionsModalProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<'quick' | 'enhanced' | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customSystemInstruction, setCustomSystemInstruction] = useState('');
  const [customUserPrompt, setCustomUserPrompt] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [priorityAreas, setPriorityAreas] = useState('');
  const [specificConcerns, setSpecificConcerns] = useState('');

  // Get default prompt templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery<{data: PromptTemplates}>(
    'prompt-templates',
    () => projectAPI.getPromptTemplates(),
    { enabled: isOpen && showPromptEditor }
  );

  // Generate recommendation mutation
  const generateMutation = useMutation(
    (data: any) => projectAPI.generateRecommendation(data),
    {
      onSuccess: (response) => {
        toast.success('Analysis completed successfully!');
        onAnalysisComplete(response.data);
        onClose();
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Analysis failed');
      }
    }
  );

  // Load default templates when prompt editor opens
  useEffect(() => {
    if (templatesData && showPromptEditor) {
      if (!customSystemInstruction) {
        setCustomSystemInstruction(templatesData.data.system_instruction);
      }
      if (!customUserPrompt) {
        setCustomUserPrompt(templatesData.data.user_prompt);
      }
    }
  }, [templatesData, showPromptEditor]);

  const resetForm = () => {
    setSelectedAnalysis(null);
    setShowPromptEditor(false);
    setCustomSystemInstruction('');
    setCustomUserPrompt('');
    setAdditionalContext('');
    setPriorityAreas('');
    setSpecificConcerns('');
  };

  const handleAnalysisSelect = (type: 'quick' | 'enhanced') => {
    setSelectedAnalysis(type);
    if (type === 'quick') {
      setShowPromptEditor(false); // Quick analysis doesn't use custom prompts
    }
  };

  const handleGenerate = () => {
    if (!selectedAnalysis) return;

    const requestData: any = {
      project_id: projectId,
      analysis_type: selectedAnalysis,
    };

    // Add optional fields if provided
    if (additionalContext.trim()) {
      requestData.additional_context = additionalContext.trim();
    }

    if (priorityAreas.trim()) {
      requestData.priority_areas = priorityAreas.split(',').map(area => area.trim()).filter(area => area);
    }

    if (specificConcerns.trim()) {
      requestData.specific_concerns = specificConcerns.split(',').map(concern => concern.trim()).filter(concern => concern);
    }

    // Add custom prompts for enhanced analysis
    if (selectedAnalysis === 'enhanced' && showPromptEditor) {
      if (customSystemInstruction.trim() && customSystemInstruction !== templatesData?.data.system_instruction) {
        requestData.custom_system_instruction = customSystemInstruction.trim();
      }
      if (customUserPrompt.trim() && customUserPrompt !== templatesData?.data.user_prompt) {
        requestData.custom_user_prompt = customUserPrompt.trim();
      }
    }

    generateMutation.mutate(requestData);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Choose Analysis Type for "{projectTitle}"
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                    disabled={generateMutation.isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Quick Analysis */}
                  <div 
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                      selectedAnalysis === 'quick' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnalysisSelect('quick')}
                  >
                    <div className="flex items-center mb-4">
                      <BoltIcon className="h-8 w-8 text-green-600 mr-3" />
                      <h4 className="text-lg font-semibold">Quick Analysis</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>~30 seconds</span>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        <span>Free</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      Uses local neural network trained on Sampang cultural patterns. 
                      Provides immediate risk assessment and basic recommendations based on 
                      established cultural knowledge patterns.
                    </p>

                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="flex items-start">
                        <InformationCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <p className="font-medium mb-1">Best for:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Initial project assessment</li>
                            <li>Quick risk screening</li>
                            <li>Budget-conscious analysis</li>
                            <li>Time-sensitive decisions</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Analysis */}
                  <div 
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                      selectedAnalysis === 'enhanced' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnalysisSelect('enhanced')}
                  >
                    <div className="flex items-center mb-4">
                      <BeakerIcon className="h-8 w-8 text-purple-600 mr-3" />
                      <h4 className="text-lg font-semibold">Enhanced Analysis</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>~2-5 minutes</span>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        <span>~$0.10-0.50</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">
                      Uses advanced AI (OpenRouter) with comprehensive cultural knowledge base. 
                      Provides detailed analysis, nuanced recommendations, and comprehensive 
                      risk assessment with specific cultural context.
                    </p>

                    <div className="bg-purple-50 p-3 rounded-md mb-4">
                      <div className="flex items-start">
                        <InformationCircleIcon className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-purple-800">
                          <p className="font-medium mb-1">Best for:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Critical project decisions</li>
                            <li>Complex stakeholder situations</li>
                            <li>Detailed implementation planning</li>
                            <li>High-value projects</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Cost & Time Notice:</p>
                          <p>This analysis uses AI services that incur costs and may take several minutes to complete.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                {selectedAnalysis && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium mb-4">Additional Options (Optional)</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="form-label">Additional Context</label>
                        <textarea
                          className="form-textarea h-20"
                          placeholder="Any specific information about your project, location, or concerns..."
                          value={additionalContext}
                          onChange={(e) => setAdditionalContext(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Priority Areas (comma-separated)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., religious sites, environmental impact, employment"
                          value={priorityAreas}
                          onChange={(e) => setPriorityAreas(e.target.value)}
                        />
                        <div className="mt-2">
                          <label className="form-label">Specific Concerns (comma-separated)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., land disputes, water access, noise pollution"
                            value={specificConcerns}
                            onChange={(e) => setSpecificConcerns(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Prompt Editor for Enhanced Analysis */}
                    {selectedAnalysis === 'enhanced' && (
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => setShowPromptEditor(!showPromptEditor)}
                          className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          {showPromptEditor ? 'Hide' : 'Customize'} AI Instructions (Advanced)
                        </button>
                        
                        {showPromptEditor && (
                          <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                            {templatesLoading ? (
                              <div className="text-center py-4">Loading templates...</div>
                            ) : (
                              <div className="space-y-4">
                                <div>
                                  <label className="form-label">System Instruction</label>
                                  <textarea
                                    className="form-textarea h-32 text-sm"
                                    value={customSystemInstruction}
                                    onChange={(e) => setCustomSystemInstruction(e.target.value)}
                                    placeholder="Define the AI's role and expertise..."
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {templatesData?.data.recommended_usage.system_instruction}
                                  </p>
                                </div>
                                
                                <div>
                                  <label className="form-label">User Prompt Template</label>
                                  <textarea
                                    className="form-textarea h-32 text-sm"
                                    value={customUserPrompt}
                                    onChange={(e) => setCustomUserPrompt(e.target.value)}
                                    placeholder="Structure the analysis request..."
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {templatesData?.data.recommended_usage.user_prompt}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={generateMutation.isLoading}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!selectedAnalysis || generateMutation.isLoading}
                    className="btn-primary flex items-center"
                  >
                    {generateMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Start {selectedAnalysis === 'quick' ? 'Quick' : 'Enhanced'} Analysis
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}