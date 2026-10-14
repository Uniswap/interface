import { resolveTrustedClientIp } from 'functions/trustedClientIp'

function headers(values: Record<string, string>): (name: string) => string | undefined {
  return (name) => values[name]
}

describe('resolveTrustedClientIp', () => {
  it('ignores cf-connecting-ip: CloudFront neither sets nor strips it', () => {
    const ip = resolveTrustedClientIp(
      headers({ 'cf-connecting-ip': '198.51.100.7', 'x-forwarded-for': '203.0.113.9, 130.176.1.4' }),
    )
    expect(ip).toBe('130.176.1.4')
  })

  it.each([
    ['203.0.113.9:51234', '203.0.113.9'],
    ['2001:db8::1:443', '2001:db8::1'],
    ['203.0.113.9', '203.0.113.9'],
  ])('strips the port from cloudfront-viewer-address %s', (address, expected) => {
    expect(resolveTrustedClientIp(headers({ 'cloudfront-viewer-address': address }))).toBe(expected)
  })

  it('prefers cloudfront-viewer-address over x-forwarded-for', () => {
    const ip = resolveTrustedClientIp(
      headers({ 'cloudfront-viewer-address': '203.0.113.9:443', 'x-forwarded-for': '198.51.100.7' }),
    )
    expect(ip).toBe('203.0.113.9')
  })

  it('uses the rightmost x-forwarded-for entry, never the client-controlled leftmost', () => {
    expect(resolveTrustedClientIp(headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2 , 3.3.3.3' }))).toBe('3.3.3.3')
  })

  it.each<Record<string, string>>([{}, { 'x-forwarded-for': '' }, { 'x-forwarded-for': ' , ' }])(
    'returns undefined for %j',
    (values) => {
      expect(resolveTrustedClientIp(headers(values))).toBeUndefined()
    },
  )
})
