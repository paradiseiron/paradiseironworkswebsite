import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";

export async function createSignedImageUrls(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  paths: string[],
  expiresIn = 60 * 60
) {
  if (!paths.length) return [];

  const [{ data: originals }, thumbnails] = await Promise.all([
    supabase.storage.from(bucket).createSignedUrls(paths, expiresIn),
    Promise.all(
      paths.map((path) =>
        supabase.storage.from(bucket).createSignedUrl(path, expiresIn, {
          transform: {
            width: 480,
            height: 480,
            resize: "cover",
            quality: 72,
          },
        })
      )
    ),
  ]);

  return paths.map((path, index) => {
    const url = originals?.[index]?.signedUrl || "";
    return {
      path,
      url,
      thumbnailUrl: thumbnails[index]?.data?.signedUrl || url,
    };
  });
}
