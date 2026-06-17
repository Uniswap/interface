export function stripTrailingSlashesFromWebsiteUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
