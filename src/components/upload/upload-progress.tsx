'use client';

import { CheckCircle2, AlertCircle, StopCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  status: 'uploading' | 'success' | 'error';
  progress: number;
  videoId?: string;
  errorMessage?: string;
  onAbort?: () => void;
}

export const UploadProgress = ({
  status,
  progress,
  videoId,
  errorMessage,
  onAbort,
}: UploadProgressProps) => {
  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900/30 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100">Upload Complete</h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Video ID:{' '}
              <code className="font-mono bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs">
                {videoId}
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">Upload Failed</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {errorMessage || 'An error occurred during upload'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">Uploading...</h3>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {onAbort && (
        <button
          onClick={onAbort}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          <StopCircle className="h-4 w-4" />
          Stop Upload
        </button>
      )}
    </div>
  );
}
