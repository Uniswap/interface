import { getRGBColor } from 'functions/utils/getRGBColor'

const DEFAULT_COLOR = { red: 35, green: 43, blue: 43 }

/**
 * Regression tests for the SSRF/defense-in-depth posture of the OG-image
 * color extractor. The URL flows in from the backend GraphQL response
 * (`project.logoUrl`); if the upstream ever returns a non-https or
 * IP-literal URL it should not be fetched.
 */
describe('getRGBColor — input validation', () => {
  const originalFetch = globalThis.fetch
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn().mockRejectedValue(new Error('test guard: fetch should not be called'))
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns DEFAULT_COLOR without fetching when imageUrl is undefined', async () => {
    expect(await getRGBColor(undefined)).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns DEFAULT_COLOR without fetching for file:// URLs', async () => {
    expect(await getRGBColor('file://attacker/etc/hostname')).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns DEFAULT_COLOR without fetching for data: URLs', async () => {
    expect(
      await getRGBColor(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAAAEAAH2FzhVAAAAAElFTkSuQmCC',
      ),
    ).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns DEFAULT_COLOR without fetching for http:// URLs', async () => {
    expect(await getRGBColor('http://example.com/logo.png')).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns DEFAULT_COLOR without fetching for IP-literal hostnames', async () => {
    expect(await getRGBColor('https://169.254.169.254/latest/meta-data/iam')).toEqual(DEFAULT_COLOR)
    expect(await getRGBColor('https://127.0.0.1/admin')).toEqual(DEFAULT_COLOR)
    expect(await getRGBColor('https://[::1]/admin')).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns DEFAULT_COLOR without fetching for localhost', async () => {
    expect(await getRGBColor('https://localhost/logo.png')).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns DEFAULT_COLOR without fetching for URLs with userinfo', async () => {
    expect(await getRGBColor('https://attacker:pwd@example.com/logo.png')).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns DEFAULT_COLOR for malformed URLs', async () => {
    expect(await getRGBColor('not a url')).toEqual(DEFAULT_COLOR)
    expect(await getRGBColor('//example.com/logo.png')).toEqual(DEFAULT_COLOR)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('proceeds to fetch for an https URL with a DNS hostname', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(new ArrayBuffer(0), { status: 200, headers: { 'content-type': 'image/unknown' } }),
    )
    await getRGBColor('https://assets.example.com/logo.png')
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [calledUrl, init] = fetchSpy.mock.calls[0]
    expect((calledUrl as URL).toString()).toBe('https://assets.example.com/logo.png')
    expect(init?.redirect).toBe('error')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })
})
