export interface s3PresignResponse {
  expiresIn: number;
  mediaId: string;
  presignedUrl: string;
}
