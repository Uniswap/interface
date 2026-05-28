import { metaTagInjectionMiddleware } from 'functions/components/metaTagInjector'
import { Context } from 'hono'

// Mock HTML content for testing
const mockHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <div>Content</div>
</body>
</html>
`

// Helper function to create a mock Hono context
function createMockContext(url: string, headers: Record<string, string> = {}): Context {
  const req = new Request(url, { headers })
  return {
    req: {
      url,
      header: (name: string) => headers[name.toLowerCase()],
      raw: req,
    },
    res: new Response(mockHtml, {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  } as Context
}

describe('metaTagInjectionMiddleware', () => {
  test('should inject meta tags for matching paths', async () => {
    const c = createMockContext('http://localhost:3000/')
    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    const response = await metaTagInjectionMiddleware(c, next)

    expect(nextCalled).toBe(true)
    const responseText = await response.text()

    // Check that meta tags were injected
    expect(responseText).toContain('<meta property="og:title" content="Uniswap Interface"')
    expect(responseText).toContain(
      '<meta property="og:description" content="Swap crypto on Ethereum, Base, Arbitrum, Polygon, Unichain and more. The DeFi platform trusted by millions."',
    )
    expect(responseText).toContain(
      '<meta name="description" content="Swap crypto on Ethereum, Base, Arbitrum, Polygon, Unichain and more. The DeFi platform trusted by millions."',
    )
    expect(responseText).toContain(
      '<meta property="og:image" content="http://localhost:3000/images/1200x630_Rich_Link_Preview_Image.png"',
    )
    expect(responseText).toContain('<meta property="og:image:width" content="1200"')
    expect(responseText).toContain('<meta property="og:image:height" content="630"')
    expect(responseText).toContain('<meta property="og:type" content="website"')
    expect(responseText).toContain('<meta property="og:image:alt" content="Uniswap Interface"')
    expect(responseText).toContain('<meta property="twitter:card" content="summary_large_image"')
    expect(responseText).toContain('<meta property="twitter:title" content="Uniswap Interface"')
    expect(responseText).toContain(
      '<meta property="twitter:image" content="http://localhost:3000/images/1200x630_Rich_Link_Preview_Image.png"',
    )
    expect(responseText).toContain('<meta property="twitter:image:alt" content="Uniswap Interface"')
    expect(responseText).toContain('<meta property="og:url" content="http://localhost:3000/"')
  })

  test('should inject meta tags for swap page', async () => {
    const c = createMockContext('http://localhost:3000/swap')
    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    const response = await metaTagInjectionMiddleware(c, next)

    expect(nextCalled).toBe(true)
    const responseText = await response.text()

    expect(responseText).toContain('<meta property="og:title" content="Uniswap Interface"')
    expect(responseText).toContain('<meta property="og:url" content="http://localhost:3000/swap"')
  })

  test('should inject meta tags for pool page', async () => {
    const c = createMockContext('http://localhost:3000/pool')
    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    const response = await metaTagInjectionMiddleware(c, next)

    expect(nextCalled).toBe(true)
    const responseText = await response.text()

    expect(responseText).toContain('<meta property="og:title" content="Uniswap Interface"')
    expect(responseText).toContain('<meta property="og:url" content="http://localhost:3000/pool"')
  })

  test('should pass through header blocked paths', async () => {
    const c = createMockContext('http://localhost:3000/', { 'x-blocked-paths': '/' })
    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    const response = await metaTagInjectionMiddleware(c, next)

    expect(nextCalled).toBe(true)
    const responseText = await response.text()

    expect(responseText).toContain('<meta property="x:blocked-paths" content="/"')
  })

  test('should not process non-HTML responses', async () => {
    const c = createMockContext('http://localhost:3000/')
    // Override response to be JSON
    c.res = new Response('{"test": "data"}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    await metaTagInjectionMiddleware(c, next)

    expect(nextCalled).toBe(true)
    const responseText = await c.res.text()

    // Should not contain meta tags
    expect(responseText).not.toContain('<meta property="og:title"')
    expect(responseText).toBe('{"test": "data"}')
  })

  test('should not process non-200 responses', async () => {
    const c = createMockContext('http://localhost:3000/')
    // Override response to be 404
    c.res = new Response(mockHtml, {
      status: 404,
      headers: { 'content-type': 'text/html' },
    })
    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    await metaTagInjectionMiddleware(c, next)

    expect(nextCalled).toBe(true)
    const responseText = await c.res.text()

    // Should not contain meta tags
    expect(responseText).not.toContain('<meta property="og:title"')
  })

  test('should not process non-matching paths', async () => {
    const c = createMockContext('http://localhost:3000/some-random-path')
    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    await metaTagInjectionMiddleware(c, next)

    expect(nextCalled).toBe(true)
    const responseText = await c.res.text()

    // Should not contain meta tags (original response should be unchanged)
    expect(responseText).not.toContain('<meta property="og:title"')
  })

  test('should handle errors gracefully', async () => {
    const c = createMockContext('http://localhost:3000/')
    // Make response.clone() throw an error
    c.res = {
      status: 200,
      headers: { get: () => 'text/html' },
      clone: () => {
        throw new Error('Clone error')
      },
      text: () => Promise.resolve('<html></html>'),
    } as any

    let nextCalled = false

    const next = async () => {
      nextCalled = true
    }

    // Should not throw and should return a response
    const response = await expect(metaTagInjectionMiddleware(c, next)).resolves.toBeDefined()
    expect(nextCalled).toBe(true)
    expect(response).toBeInstanceOf(Object)
  })
})
