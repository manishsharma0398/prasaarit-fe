export interface MultipartUploadInitiateResponse {
  s3Key: string;
  uploadId: string;
}

export interface MultipartUploadCompleteRequest {
  parts: Array<string>;
  uploadId: string;
  s3Key: string;
}

export interface MultipartUploadCompleteResponse {
  success: boolean;
  uploadId: string;
}

export interface MultipartUploadAbortRequest {
  uploadId: string;
  s3Key: string;
}

export interface MultipartUploadAbortResponse {
  success: boolean;
  uploadId: string;
}
