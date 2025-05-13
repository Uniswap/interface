export function normalizeBase64Image(uri: string): string {
  return uri.replace(/\\n|[\n\r]/g, '').trim()
}
