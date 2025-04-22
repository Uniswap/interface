export const objectToQueryString = (obj: Record<string, string | number | boolean>): string => {
  return Object.entries(obj)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}
