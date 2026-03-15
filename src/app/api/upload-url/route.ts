import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    uploadUrl: "example-url",
    videoId: "123",
  });
}
