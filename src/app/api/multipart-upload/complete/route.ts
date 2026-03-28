import {
  MultipartUploadCompleteRequest,
  MultipartUploadCompleteResponse,
} from "@/types/multipart-upload";
import { upstream } from "@/lib/upstream";
import { NextRequest } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { parts, s3Key, uploadId }: MultipartUploadCompleteRequest = await req.json();

    if (!s3Key || !uploadId) {
      return Response.json({ error: "s3Key and uploadId are required" }, { status: 400 });
    }

    if (!Array.isArray(parts) || parts.length === 0) {
      return Response.json({ error: "parts must be a non-empty array" }, { status: 400 });
    }

    if (!process.env.UPLOAD_API_BASE_URL) {
      console.error("UPLOAD_API_BASE_URL env variable is missing");
      return Response.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const { data } = await upstream.post<MultipartUploadCompleteResponse>(
      "/complete-multipart-upload",
      { s3Key, uploadId, parts }
    );

    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 502;
      const message = err.response?.data?.message ?? "Failed to complete multipart upload";
      return Response.json({ error: message }, { status });
    }

    console.error("Complete multipart upload route error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
