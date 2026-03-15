"use client";

import { useState } from "react";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { UploadButton } from "@/components/upload/upload-button";
import { UploadProgress } from "@/components/upload/upload-progress";
import { Empty } from "@/components/ui/empty";
import { FileVideo } from "lucide-react";

type UploadState = "idle" | "file-selected" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setState("file-selected");
    setProgress(0);
    setVideoId(null);
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setState("uploading");
    setProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const urlResponse = await fetch("/api/upload-url", {
        method: "POST",
      });

      if (!urlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, videoId: newVideoId } = await urlResponse.json();
      setVideoId(newVideoId);

      // Step 2: Upload file to S3 using presigned URL
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          setState("success");
        } else {
          throw new Error("Failed to upload file to S3");
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        throw new Error("Network error during upload");
      });

      // Handle abort
      xhr.addEventListener("abort", () => {
        throw new Error("Upload cancelled");
      });

      // Start the upload
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader(
        "Content-Type",
        selectedFile.type || "application/octet-stream",
      );
      xhr.send(selectedFile);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setErrorMessage(message);
      setState("error");
      setProgress(0);
    }
  };

  const handleReset = () => {
    setState("idle");
    setSelectedFile(null);
    setProgress(0);
    setVideoId(null);
    setErrorMessage(null);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Video
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your content with the world. Upload a video to get started.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            {/* State: Idle or File Selected */}
            {(state === "idle" || state === "file-selected") && (
              <>
                <UploadDropzone
                  onFileSelect={handleFileSelect}
                  isDisabled={state === "uploading"}
                />
                {selectedFile && state === "file-selected" && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          File Details
                        </h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Name:</span>{" "}
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Size:</span>{" "}
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Type:</span>{" "}
                            {selectedFile.type || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleReset}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
                {state === "file-selected" && (
                  <UploadButton
                    isDisabled={!selectedFile}
                    isLoading={false}
                    onClick={handleUpload}
                    fileName={selectedFile?.name}
                  />
                )}
              </>
            )}

            {/* State: Uploading, Success, or Error */}
            {(state === "uploading" ||
              state === "success" ||
              state === "error") && (
              <>
                <UploadProgress
                  status={state as "uploading" | "success" | "error"}
                  progress={progress}
                  videoId={videoId || undefined}
                  errorMessage={errorMessage || undefined}
                />
                {(state === "success" || state === "error") && (
                  <button
                    onClick={handleReset}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Upload Another Video
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Your Videos Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Uploaded Videos
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <Empty
              icon={FileVideo}
              title="No videos yet"
              description="Your uploaded videos will appear here once you complete your first upload."
            />
          </div>
        </div>
      </div>
    </main>
  );
}
