export interface s3PresignResponse {
    expiresIn: number;
    key: string;
    presignedUrl: string;
    videoId: string;
}