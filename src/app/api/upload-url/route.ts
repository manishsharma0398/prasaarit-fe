import { s3PresignResponse } from "@/types/upload-url";
import { NextRequest } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime (important for AWS SDK later)

export async function POST(req: NextRequest): Promise<s3PresignResponse | Response> {
  try {
    const body = await req.json();
    const { contentType, fileSize } = body ?? {};

    // Validate input
    if (!contentType || !fileSize) {
      return Response.json(
        { error: "contentType and fileSize are required" },
        { status: 400 },
      );
    }

    const apiUrl = process.env.API_GW_URL;

    console.log("API URL:", apiUrl);
    console.log("Calling:", `${apiUrl}/generate-presigned-url`);

    if (!apiUrl) {
      console.error("API_GW_URL env variable is missing");
      return Response.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    // Call API Gateway
    const response = await fetch(`${apiUrl}/generate-presigned-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contentType, fileSize }),
      cache: "no-store",
    });

    // Handle upstream errors safely
    if (!response.ok) {
      let errorMessage = "Failed to generate upload URL";

      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch (err) {
        console.error("Presign route error:", err);

        return Response.json(
          { error: String(err) },
          { status: 500 }
        );
        // API returned non-JSON
      }

      return Response.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    const data: s3PresignResponse = await response.json();

    return Response.json(data);
  } catch (err) {
    console.error("Presign route error:", err);

    return Response.json({ error: String(err) }, { status: 500 });
  }
}
