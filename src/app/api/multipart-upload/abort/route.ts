import {
  MultipartUploadAbortRequest,
  MultipartUploadAbortResponse,
} from '@/types/multipart-upload';
import { upstream } from '@/lib/upstream';
import { NextRequest } from 'next/server';
import axios from 'axios';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { s3Key, uploadId }: MultipartUploadAbortRequest = await req.json();

    if (!s3Key || !uploadId) {
      return Response.json({ error: 's3Key and uploadId are required' }, { status: 400 });
    }

    if (!process.env.UPLOAD_API_BASE_URL) {
      console.error('UPLOAD_API_BASE_URL env variable is missing');
      return Response.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const { data } = await upstream.post<MultipartUploadAbortResponse>('/abort-multipart-upload', {
      s3Key,
      uploadId,
    });

    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 502;
      const message = err.response?.data?.message ?? 'Failed to abort multipart upload';
      return Response.json({ error: message }, { status });
    }

    console.error('Abort multipart upload route error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
