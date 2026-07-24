"use client";

const MAX_IMAGE_DIMENSION = 2048;
const COMPRESSION_THRESHOLD_BYTES = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.82;

export async function prepareImageInput(input: HTMLInputElement) {
  const originals = Array.from(input.files || []);
  const files = await Promise.all(originals.map(compressImageFile));

  try {
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
  } catch {
    // Some older browsers do not allow replacing FileList. Callers still use
    // the compressed return value whenever they submit files client-side.
  }

  return files;
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
    );

    if (scale === 1 && file.size <= COMPRESSION_THRESHOLD_BYTES) {
      image.close();
      return file;
    }

    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      image.close();
      return file;
    }

    context.drawImage(image, 0, 0, width, height);
    image.close();

    const outputType = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, JPEG_QUALITY)
    );

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], replaceExtension(file.name, outputType), {
      type: outputType,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

function replaceExtension(name: string, type: string) {
  const extension = type === "image/webp" ? "webp" : "jpg";
  const base = name.replace(/\.[^./\\]+$/, "") || "photo";
  return `${base}.${extension}`;
}
