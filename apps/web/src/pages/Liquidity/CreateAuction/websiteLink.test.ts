import { describe, expect, it } from 'vitest'
import { stripTrailingSlashesFromWebsiteUrl } from '~/pages/Liquidity/CreateAuction/websiteLink'

describe('website link display', () => {
  it('strips trailing slashes for display', () => {
    expect(stripTrailingSlashesFromWebsiteUrl('https://example.com/')).toBe('https://example.com')
    expect(stripTrailingSlashesFromWebsiteUrl('example.com///')).toBe('example.com')
    expect(stripTrailingSlashesFromWebsiteUrl('  https://a.com/path/  ')).toBe('https://a.com/path')
  })
})
