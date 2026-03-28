'use client';

import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface UploadButtonProps {
  isDisabled: boolean;
  isLoading: boolean;
  onClick: () => void;
  fileName?: string;
}

export const UploadButton = ({ isDisabled, isLoading, onClick, fileName }: UploadButtonProps) => {
  return (
    <div className="space-y-3">
      {fileName && (
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Selected file</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{fileName}</p>
          </div>
        </div>
      )}
      <Button onClick={onClick} disabled={isDisabled || isLoading} size="lg" className="w-full">
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Start Upload
          </>
        )}
      </Button>
    </div>
  );
}
