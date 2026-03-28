export interface MultipartUploadLocalStorage {
  s3Key: string;
  uploadId: string;
  fileName: string;
  fileSize: number;
  totalParts: number;
  uploadedParts: number[];
}
