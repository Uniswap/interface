import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'

describe('extractNameFromUrl', () => {
  it('should extract second-level domain from a valid URL', () => {
    expect(extractNameFromUrl('https://www.example.com')).toBe('example')
    expect(extractNameFromUrl('http://app.example.com')).toBe('example')
    expect(extractNameFromUrl('https://example.co.uk')).toBe('example')
    expect(extractNameFromUrl('https://example.org')).toBe('example')
    expect(extractNameFromUrl('https://example.reallylongtld')).toBe('example')
    expect(extractNameFromUrl('ftp://example.com')).toBe('example')
  })

  it('should return the URL w/o a scheme for invalid URLs', () => {
    expect(extractNameFromUrl('ipfs://invalid-url')).toBe('invalid-url')
    expect(extractNameFromUrl('https://example')).toBe('example')
  })

  it('should return an empty string for empty or undefined input', () => {
    expect(extractNameFromUrl('')).toBe('')
    expect(extractNameFromUrl(undefined)).toBe('')
  })

  it('should handle URLs with ports', () => {
    expect(extractNameFromUrl('https://example.com:8080')).toBe('example')
    expect(extractNameFromUrl('http://localhost:3000')).toBe('localhost:3000')
  })

  it('should handle URLs with query parameters', () => {
    expect(extractNameFromUrl('https://example.com?query=1')).toBe('example')
    expect(extractNameFromUrl('https://app.example.com/page?query=1')).toBe('example')
  })

  it('should handle URLs with fragments', () => {
    expect(extractNameFromUrl('https://example.com#section')).toBe('example')
    expect(extractNameFromUrl('https://app.example.com/page#section')).toBe('example')
  })

  it('should handle internationalized domain names (IDNs)', () => {
    expect(extractNameFromUrl('https://xn--fsq@-8p7a.com')).toBe('xn--fsq@-8p7a')
    // not ideal but would require a much slower regex or non-regex logic
    expect(extractNameFromUrl('https://example.中国')).toBe('example.中国')
  })
})
