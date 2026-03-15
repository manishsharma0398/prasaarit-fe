"use client";

import { useRef, useState } from "react";
import { Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isDisabled?: boolean;
}

export function UploadDropzone({
  onFileSelect,
  isDisabled,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabled) {
      setIsDragActive(e.type === "dragenter" || e.type === "dragover");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isDisabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidVideoFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleClick = () => {
    if (!isDisabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidVideoFile(file)) {
        onFileSelect(file);
      }
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isValidVideoFile = (file: File): boolean => {
    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    return validTypes.includes(file.type);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer",
        isDragActive && !isDisabled
          ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/20"
          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900/50",
        isDisabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Cloud className="w-12 h-12 text-gray-400" />
        <div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Drag and drop your video here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or click to browse your files
          </p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Supported formats: MP4, MOV, WebM
        </p>
      </div>
    </div>
  );
}
