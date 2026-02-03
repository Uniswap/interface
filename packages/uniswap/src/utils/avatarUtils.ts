/**
 * Validates that an avatar URI uses a safe protocol
 * Only allows http:// and https:// absolute URLs to prevent XSS and directory traversal attacks
 * @param uri - The avatar URI to validate
 * @returns The validated URI if safe, null otherwise
 */
export function sanitizeAvatarUri(
  uri: string | null | undefined,
): string | null {
  if (!uri) {
    return null;
  }

  try {
    // Parse the URI to extract the protocol
    const url = new URL(uri);

    // Only allow http and https protocols
    if (url.protocol === "http:" || url.protocol === "https:") {
      return uri;
    }

    // eslint-disable-next-line no-restricted-syntax
    console.warn(`Rejected avatar URI with unsafe protocol: ${url.protocol}`);
    return null;
  } catch (error) {
    // If URI parsing fails, reject it
    // We do NOT allow relative paths to prevent directory traversal attacks
    // eslint-disable-next-line no-restricted-syntax
    console.warn("Rejected invalid avatar URI:", uri);
    return null;
  }
}
