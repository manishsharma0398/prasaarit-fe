import {
  MultipartUploadCompleteRequest,
  MultipartUploadCompleteResponse,
} from "@/types/multipart-upload";
import { NextRequest } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime (important for AWS SDK later)

export async function POST(
  req: NextRequest,
): Promise<MultipartUploadCompleteResponse | Response> {
  try {
    const body: MultipartUploadCompleteRequest = await req.json();
    const { parts, s3Key, uploadId } = body ?? {};

    // Validate input
    if (!s3Key || !uploadId || !parts || !Array.isArray(parts)) {
      return Response.json(
        { error: "s3Key, uploadId, and parts are required" },
        { status: 400 },
      );
    }

    const apiUrl = "http://127.0.0.1:8000";
    // const apiUrl = process.env.API_GW_URL;

    console.log("API URL:", apiUrl);
    console.log("Calling:", `${apiUrl}/complete-multipart-upload`);

    if (!apiUrl) {
      console.error("API_GW_URL env variable is missing");
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    // Call API Gateway
    const response = await fetch(`${apiUrl}/complete-multipart-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ s3Key, uploadId, parts }),
      cache: "no-store",
    });

    // Handle upstream errors safely
    if (!response.ok) {
      let errorMessage = "Failed to complete multipart upload";

      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch (err) {
        console.error("Complete multipart upload route error:", err);

        return Response.json({ error: String(err) }, { status: 500 });
        // API returned non-JSON
      }

      return Response.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    const data: MultipartUploadCompleteResponse = await response.json();

    return Response.json(data);
  } catch (err) {
    console.error("Complete multipart upload route error:", err);

    return Response.json({ error: String(err) }, { status: 500 });
  }
}
