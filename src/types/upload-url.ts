export interface s3PresignRequest {
  partNumber?: number;
  uploadId?: string;
  s3Key?: string;

  fileSize: number;
  contentType: string;
  type: string;
}

export interface s3PresignResponse {
  expiresIn: number;
  mediaId: string;
  presignedUrl: string;
}
