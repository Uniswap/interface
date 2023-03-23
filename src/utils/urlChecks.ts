export function hasURL(str?: string): boolean {
  if (!str) return false
  const pattern = new RegExp(
    '([a-zA-Z0-9]+://)?' + // optional protocol
      '([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?' + //  optional username:password
      '([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})' + // host name and subdomain
      '(:[0-9]+)?(/.*)?' // optional port and path
  )

  return pattern.test(str)
}
