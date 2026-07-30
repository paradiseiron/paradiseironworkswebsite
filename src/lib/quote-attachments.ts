export const QUOTE_ATTACHMENT_MAX_FILES = 5;
export const QUOTE_ATTACHMENT_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const QUOTE_ATTACHMENT_MAX_TOTAL_BYTES = 30 * 1024 * 1024;

export const QUOTE_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "pdf",
]);

export function isAllowedQuoteAttachment(file: {
  name: string;
  type: string;
}) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return (
    QUOTE_ATTACHMENT_TYPES.has(file.type.toLowerCase()) &&
    ALLOWED_EXTENSIONS.has(extension)
  );
}

export function safeAttachmentName(name: string) {
  return (
    name
      .replace(/^.*[\\/]/, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(-120) || "attachment"
  );
}
