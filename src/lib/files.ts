export const getFileUrl = (fileId?: string | null) =>
  fileId ? `/api/files/${fileId}` : undefined;
