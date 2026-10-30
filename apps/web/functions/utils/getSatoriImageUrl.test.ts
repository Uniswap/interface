import { getSatoriImageUrl } from 'functions/utils/getSatoriImageUrl'

describe('getSatoriImageUrl', () => {
  it.each(['https://example.com/logo.png', 'http://example.com/logo.svg', 'https://example.com/logo.png?v=2'])(
    'keeps absolute http(s) URL %s',
    (url) => {
      expect(getSatoriImageUrl(url)).toBe(url)
    },
  )

  it.each([undefined, ''])('returns undefined for missing URL %j', (url) => {
    expect(getSatoriImageUrl(url)).toBeUndefined()
  })

  it.each([
    'ipfs://bafkreiexample/logo.png',
    'ar://example-tx-id',
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
    '/relative/logo.png',
    'not a url',
  ])('rejects %s', (url) => {
    expect(getSatoriImageUrl(url)).toBeUndefined()
  })

  it.each([
    'https://example.com/logo.webp',
    'https://example.com/LOGO.WEBP',
    'https://example.com/logo.webp?v=2',
    'https://proxy.example/?url=https://x.example/logo.webp',
    'https://proxy.example/image?url=https%3A%2F%2Fx.example%2FLOGO.WEBP',
  ])('rejects webp image %s', (url) => {
    expect(getSatoriImageUrl(url)).toBeUndefined()
  })

  it('keeps a non-webp image on a host that contains .webp', () => {
    expect(getSatoriImageUrl('https://cdn.webp.example/logo.png')).toBe('https://cdn.webp.example/logo.png')
  })

  it.each([
    ['https://example.com/my logo.png', 'https://example.com/my%20logo.png'],
    ['https://example.com/logo(1).png', 'https://example.com/logo%281%29.png'],
    ["https://example.com/token's.png", 'https://example.com/token%27s.png'],
  ])('escapes characters that would break an unquoted CSS url(): %s', (url, expected) => {
    expect(getSatoriImageUrl(url)).toBe(expected)
  })
})
