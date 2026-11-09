import type { Storage } from "node-appwrite";

import { IMAGES_BUCKET_ID } from "@/config";

export const deleteImage = async (storage: Storage, imageId?: string | null) => {
  if (!imageId) return;

  await storage.deleteFile(IMAGES_BUCKET_ID, imageId).catch(() => {});
};
