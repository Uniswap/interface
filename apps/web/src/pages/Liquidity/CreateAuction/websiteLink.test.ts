import { describe, expect, it } from 'vitest'
import {
  isAllowedWebsiteLinkInput,
  isValidWebsiteLink,
  normalizeWebsiteLink,
  stripTrailingSlashesFromWebsiteUrl,
} from '~/pages/Liquidity/CreateAuction/websiteLink'

describe('website link validation', () => {
  it('allows empty and scheme-less host input', () => {
    expect(isAllowedWebsiteLinkInput('')).toBe(true)
    expect(isAllowedWebsiteLinkInput('www.example.com')).toBe(true)
    expect(isValidWebsiteLink('')).toBe(true)
    expect(isValidWebsiteLink('www.example.com')).toBe(true)
  })

  it('normalizes to https', () => {
    expect(normalizeWebsiteLink('www.example.com')).toBe('https://www.example.com')
    expect(normalizeWebsiteLink('http://example.com')).toBe('https://example.com')
    expect(normalizeWebsiteLink('https://example.com/path')).toBe('https://example.com/path')
  })

  it('rejects dangerous and unsupported schemes', () => {
    const scriptScheme = ['java', 'script'].join('') + ':'
    expect(isAllowedWebsiteLinkInput(`${scriptScheme}alert(1)`)).toBe(false)
    expect(isAllowedWebsiteLinkInput('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isAllowedWebsiteLinkInput('ftp://example.com')).toBe(false)
    expect(isValidWebsiteLink(`${scriptScheme}alert(1)`)).toBe(false)
    expect(isValidWebsiteLink('ftp://example.com')).toBe(false)
  })

  it('rejects https URLs without a hostname', () => {
    expect(isValidWebsiteLink('https://')).toBe(false)
  })

  it('strips trailing slashes for display', () => {
    expect(stripTrailingSlashesFromWebsiteUrl('https://example.com/')).toBe('https://example.com')
    expect(stripTrailingSlashesFromWebsiteUrl('example.com///')).toBe('example.com')
    expect(stripTrailingSlashesFromWebsiteUrl('  https://a.com/path/  ')).toBe('https://a.com/path')
  })
})
