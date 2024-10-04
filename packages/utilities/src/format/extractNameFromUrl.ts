// shamelessly stolen from https://stackoverflow.com/a/3809435
const URL_WITH_TLD_PATTERN = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,63}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/u

function removeScheme(url: string): string {
  const splitUrl = url.split('://')
  const isSchemeInUrl = splitUrl.length > 1

  // `|| ''` is included for type safety

  if (isSchemeInUrl) {
    return splitUrl[1] || ''
  }

  return splitUrl[0] || ''
}

/**
 * Extracts the main domain name from a URL by removing the scheme ( http:// or https:// ), shorter subdomains, and TLD.
 * Ports are left in if adjacent to the computed name.
 *
 * For example:
 * - "https://app.example.com", "https://example.co.uk" and "https://app.example.com:8000" all return "example"
 * - "http://localhost:3000" returns "localhost:3000"
 * - "ipfs://invalid-url" returns "invalid-url"
 *
 * @param {string} [url] The URL from which to extract the main domain name.
 * @returns {string} The longest part of the domain name (optimistically, the name of the site)
 */
export function extractNameFromUrl(url?: string): string {
  // return empty string if url is falsy (ie empty string or undefined)
  if (!url) {
    return ''
  }

  // return url w/o scheme (if present) if no TLD (eg http://localhost:3000 -> localhost:3000)
  if (!URL_WITH_TLD_PATTERN.test(url)) {
    return removeScheme(url)
  }

  const splitUrl = url.split('.')

  // the last entry is always a TLD
  splitUrl.pop()

  // if there's a scheme, it will be in the first entry
  splitUrl[0] = removeScheme(splitUrl[0] ?? '')

  const longestDomain = splitUrl.reduce((a, b) => (a.length > b.length ? a : b))

  return longestDomain
}
