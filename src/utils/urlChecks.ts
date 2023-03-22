export function hasURL(str: string): boolean {
  const pattern = new RegExp(
    '([a-zA-Z0-9]+://)?' + // protocol
      '([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?' + // subdomain
      '([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})' + // host
      '(:[0-9]+)?(/.*)?' // port
  )

  return pattern.test(str)
}
