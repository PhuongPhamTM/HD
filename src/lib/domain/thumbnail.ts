/**
 * Checks a thumbnail URL typed by a user. Only absolute http(s) URLs are accepted, so a
 * stored value can never be a `javascript:` or `data:` URL. An empty value clears it.
 */
export function parseThumbnailUrl(
  input: string,
): { ok: true; url: string } | { ok: false; message: string } {
  const value = input.trim();
  if (!value) return { ok: true, url: "" };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, message: "Enter a full image URL, starting with https://" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    return { ok: false, message: "Only http:// or https:// image URLs are allowed." };
  return { ok: true, url: url.toString() };
}
