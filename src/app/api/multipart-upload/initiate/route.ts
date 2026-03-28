import {
  MultipartUploadInitiateRequest,
  MultipartUploadInitiateResponse,
} from "@/types/multipart-upload";
import { upstream } from "@/lib/upstream";
import { NextRequest } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { contentType, fileSize }: MultipartUploadInitiateRequest = await req.json();

    if (!contentType || !fileSize) {
      return Response.json({ error: "contentType and fileSize are required" }, { status: 400 });
    }

    if (!process.env.UPLOAD_API_BASE_URL) {
      console.error("UPLOAD_API_BASE_URL env variable is missing");
      return Response.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const { data } = await upstream.post<MultipartUploadInitiateResponse>(
      "/initiate-multipart-upload",
      { contentType, fileSize }
    );

    return Response.json(data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 502;
      const message = err.response?.data?.message ?? "Failed to initiate multipart upload";
      return Response.json({ error: message }, { status });
    }

    console.error("Initiate multipart upload route error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
