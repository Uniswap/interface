export function trimToLength(value: string, maxLength: number): string {
  if (!value) {
    return ''
  }
  const trimmed = value.trim()
  return trimmed.length > maxLength ? `${trimmed.substring(0, maxLength)}...` : trimmed
}

export function normalizeTextInput(input: string, toLowerCase = true): string {
  // Trim and replace all white spaces with a single space
  const trimmed = input.trim().replace(/\s+/g, ' ')
  return toLowerCase ? trimmed.toLowerCase() : trimmed
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function normalizeTwitterUsername(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]/g, '') // must be alphanumeric or an underscore
}
