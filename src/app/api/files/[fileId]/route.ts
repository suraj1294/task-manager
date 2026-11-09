import { NextRequest, NextResponse } from "next/server";

import { IMAGES_BUCKET_ID } from "@/config";
import { createAdminClient } from "@/lib/appwrite";
import { AUTH_COOKIE } from "@/features/auth/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  if (!request.cookies.get(AUTH_COOKIE)?.value) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { fileId } = await params;

  try {
    const { storage } = await createAdminClient();

    const [file, bytes] = await Promise.all([
      storage.getFile(IMAGES_BUCKET_ID, fileId),
      storage.getFileView(IMAGES_BUCKET_ID, fileId),
    ]);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
