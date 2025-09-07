'use client';

import { BoltIcon, BeakerIcon, ClockIcon } from '@heroicons/react/24/outline';

interface AnalysisResultBadgeProps {
  analysisType: 'quick' | 'enhanced';
  processingTime?: number;
  confidenceScore: number;
  className?: string;
}

export default function AnalysisResultBadge({
  analysisType,
  processingTime,
  confidenceScore,
  className = ''
}: AnalysisResultBadgeProps) {
  const isQuick = analysisType === 'quick';
  
  return (
    <div className={`inline-flex items-center space-x-4 ${className}`}>
      {/* Analysis Type Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isQuick 
          ? 'bg-green-100 text-green-800' 
          : 'bg-purple-100 text-purple-800'
      }`}>
        {isQuick ? (
          <BoltIcon className="h-4 w-4 mr-1.5" />
        ) : (
          <BeakerIcon className="h-4 w-4 mr-1.5" />
        )}
        {isQuick ? 'Quick Analysis' : 'Enhanced Analysis'}
      </div>

      {/* Processing Time */}
      {processingTime && (
        <div className="inline-flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          {isQuick ? (
            `${(processingTime / 1000).toFixed(1)}s`
          ) : (
            processingTime > 60000 ? 
              `${(processingTime / 60000).toFixed(1)}m` : 
              `${(processingTime / 1000).toFixed(0)}s`
          )}
        </div>
      )}

      {/* Confidence Score */}
      <div className="inline-flex items-center text-sm">
        <span className="text-gray-500 mr-1">Confidence:</span>
        <span className={`font-medium ${
          confidenceScore >= 0.8 ? 'text-green-600' :
          confidenceScore >= 0.6 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {Math.round(confidenceScore * 100)}%
        </span>
      </div>

      {/* Analysis Type Info */}
      {isQuick && (
        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
          Neural Network
        </div>
      )}
      
      {!isQuick && (
        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
          AI-Powered
        </div>
      )}
    </div>
  );
}