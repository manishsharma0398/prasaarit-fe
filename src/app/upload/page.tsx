'use client';

import axios from 'axios';
import { useRef, useState } from 'react';
import { UploadDropzone } from '@/components/upload/upload-dropzone';
import { UploadButton } from '@/components/upload/upload-button';
import { UploadProgress } from '@/components/upload/upload-progress';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { FileVideo } from 'lucide-react';
import { s3PresignResponse } from '@/types/upload-url';
import { CHUNK_SIZE } from '@/utils/constants';
import {
  MultipartUploadCompleteResponse,
  MultipartUploadInitiateResponse,
} from '@/types/multipart-upload';
import { MultipartUploadLocalStorage, CompletedPart } from '@/types/multipart-upload-local-storage';

type UploadState = 'idle' | 'file-selected' | 'uploading' | 'success' | 'error';

const UploadPage = () => {
  const [state, setState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<MultipartUploadLocalStorage | null>(null);
  // Holds the active AbortController so handleAbort can cancel in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Keeps the localStorage key accessible to handleAbort without re-computing it
  const uploadKeyRef = useRef<string | null>(null);
  const uploadMetaRef = useRef<{ s3Key: string; uploadId: string } | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setState('file-selected');
    setProgress(0);
    setVideoId(null);
    setErrorMessage(null);

    // Check for a previously interrupted upload for this exact file
    const key = `${file.name}-${String(file.size)}-${file.lastModified}`;
    const raw = localStorage.getItem(key);
    setResumeData(raw ? (JSON.parse(raw) as MultipartUploadLocalStorage) : null);
  };

  /**
   * Core upload loop — shared between fresh uploads and resumes.
   * @param file          The File object to upload
   * @param s3Key         S3 object key (from initiate or persisted)
   * @param uploadId      Multipart upload ID
   * @param priorParts    Parts already uploaded (empty for fresh uploads)
   * @param controller    AbortController for this attempt
   */
  const runUpload = async (
    file: File,
    s3Key: string,
    uploadId: string,
    priorParts: Array<CompletedPart>,
    controller: AbortController
  ) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const totalSize = file.size;
    const key = `${file.name}-${String(file.size)}-${file.lastModified}`;

    uploadKeyRef.current = key;
    uploadMetaRef.current = { s3Key, uploadId };

    // Seed already-done bytes so progress bar starts from the right place
    const completedPartNumbers = new Set(priorParts.map((p) => p.PartNumber));
    let uploadedBytes = priorParts.reduce((acc, p) => {
      const start = (p.PartNumber - 1) * CHUNK_SIZE;
      const end = Math.min(p.PartNumber * CHUNK_SIZE, totalSize);
      return acc + (end - start);
    }, 0);

    // Init progress from bytes already done
    setProgress(Math.round((uploadedBytes / totalSize) * 100));

    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
      // Skip parts we already have from a previous attempt
      if (completedPartNumbers.has(partNumber)) continue;

      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(partNumber * CHUNK_SIZE, totalSize);
      const chunk = file.slice(start, end);
      const chunkSize = end - start;

      const res = await axios.post<s3PresignResponse>(
        '/api/upload-url',
        {
          s3Key,
          uploadId,
          partNumber,
          contentType: file.type,
          fileSize: file.size,
          type: 'multipart',
        },
        { signal: controller.signal }
      );

      const uploadedChunk = await axios.put(res.data.presignedUrl, chunk, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        signal: controller.signal,
        onUploadProgress: (event) => {
          const chunkUploaded = event.loaded ?? 0;
          const overall = uploadedBytes + chunkUploaded;
          setProgress(Math.min(Math.round((overall / totalSize) * 100), 99));
        },
      });

      uploadedBytes += chunkSize;

      const eTag = String(uploadedChunk.headers.etag);

      const persistedData: MultipartUploadLocalStorage = JSON.parse(localStorage.getItem(key)!);

      const uploadedParts: Array<CompletedPart> = [
        ...persistedData.uploadedParts,
        { ETag: eTag, PartNumber: partNumber },
      ];

      localStorage.setItem(key, JSON.stringify({ ...persistedData, uploadedParts }));
    }

    const res = await axios.post<MultipartUploadCompleteResponse>(
      '/api/multipart-upload/complete',
      {
        s3Key,
        uploadId,
        parts: (JSON.parse(localStorage.getItem(key)!) as MultipartUploadLocalStorage)
          .uploadedParts,
      },
      { signal: controller.signal }
    );

    localStorage.removeItem(key);
    setVideoId(res.data.uploadId);
    setProgress(100);
    setState('success');
    setResumeData(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setState('uploading');
    setProgress(0);

    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
    const key = `${selectedFile.name}-${String(selectedFile.size)}-${selectedFile.lastModified}`;

    try {
      const res1 = await axios.post<MultipartUploadInitiateResponse>(
        '/api/multipart-upload/initiate',
        { contentType: selectedFile.type, fileSize: selectedFile.size },
        { signal: controller.signal }
      );

      const { s3Key, uploadId } = res1.data;
      setVideoId(uploadId);

      localStorage.setItem(
        key,
        JSON.stringify({
          s3Key,
          uploadId,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          totalParts: totalChunks,
          uploadedParts: [],
        })
      );

      await runUpload(selectedFile, s3Key, uploadId, [], controller);
    } catch (error) {
      if (axios.isCancel(error)) return;
      const message = error instanceof Error ? error.message : 'Upload failed';
      setErrorMessage(message);
      setState('error');
      setProgress(0);
    }
  };

  const handleResume = async () => {
    if (!selectedFile || !resumeData) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setState('uploading');
    setVideoId(resumeData.uploadId);

    try {
      await runUpload(
        selectedFile,
        resumeData.s3Key,
        resumeData.uploadId,
        resumeData.uploadedParts,
        controller
      );
    } catch (error) {
      if (axios.isCancel(error)) return;
      const message = error instanceof Error ? error.message : 'Upload failed';
      setErrorMessage(message);
      setState('error');
      setProgress(0);
    }
  };

  const handleAbort = async () => {
    // 1. Cancel the in-flight HTTP request
    abortControllerRef.current?.abort();

    const key = uploadKeyRef.current;
    const meta = uploadMetaRef.current;

    // 2. Tell S3 to discard all uploaded parts
    if (meta) {
      try {
        await axios.post('/api/multipart-upload/abort', {
          s3Key: meta.s3Key,
          uploadId: meta.uploadId,
        });
      } catch {
        // Best-effort — don't block the UI reset on a failed abort call
      }
    }

    // 3. Clean up localStorage
    if (key) localStorage.removeItem(key);

    // 4. Reset refs
    abortControllerRef.current = null;
    uploadKeyRef.current = null;
    uploadMetaRef.current = null;

    // 5. Return to file-selected so the user can retry without re-picking
    setProgress(0);
    setVideoId(null);
    setErrorMessage(null);
    setState('file-selected');
  };

  const handleReset = () => {
    setState('idle');
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Upload Video</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your content with the world. Upload a video to get started.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-8 space-y-8">
            {/* State: Idle or File Selected */}
            {(state === 'idle' || state === 'file-selected') && (
              <>
                <UploadDropzone
                  onFileSelect={handleFileSelect}
                  isDisabled={state === 'file-selected'}
                />
                {selectedFile && state === 'file-selected' && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          File Details
                        </h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Name:</span> {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Size:</span>{' '}
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Type:</span>{' '}
                            {selectedFile.type || 'Unknown'}
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
                {state === 'file-selected' && (
                  <>
                    {resumeData && (
                      <div className="flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Incomplete upload found
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                            {resumeData.uploadedParts.length} of {resumeData.totalParts} parts
                            uploaded
                          </p>
                        </div>
                        <button
                          onClick={handleResume}
                          className="shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          Resume
                        </button>
                      </div>
                    )}
                    <UploadButton
                      isDisabled={!selectedFile}
                      isLoading={false}
                      onClick={handleUpload}
                      fileName={selectedFile?.name}
                    />
                  </>
                )}
              </>
            )}

            {/* State: Uploading, Success, or Error */}
            {(state === 'uploading' || state === 'success' || state === 'error') && (
              <>
                <UploadProgress
                  status={state as 'uploading' | 'success' | 'error'}
                  progress={progress}
                  videoId={videoId || undefined}
                  errorMessage={errorMessage || undefined}
                  onAbort={state === 'uploading' ? handleAbort : undefined}
                />
                {(state === 'success' || state === 'error') && (
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
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileVideo />
                </EmptyMedia>
                <EmptyTitle>No videos yet</EmptyTitle>
                <EmptyDescription>
                  Your uploaded videos will appear here once you complete your first upload.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UploadPage;
