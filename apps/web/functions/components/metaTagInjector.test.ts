import { MetaTagInjector } from './metaTagInjector'

describe('MetaTagInjector', () => {
  let element: HTMLElement
  let injector: MetaTagInjector

  const metaData = {
    title: 'test',
    url: 'testUrl',
    image: 'testImage',
    description: 'testDescription',
  }

  beforeEach(() => {
    element = {
      append: jest.fn(),
    } as unknown as HTMLElement

    injector = new MetaTagInjector(metaData, new Request('http://localhost'))
  })

  test('should append individual meta tag correctly', () => {
    const property = 'property'
    const content = 'content'

    injector.appendProperty(element, property, content)

    expect(element.append).toHaveBeenCalledWith(
      `<meta property="${property}" content="${content}" data-rh="true">`,
      { html: true }
    )
  })

  test('should append all required meta tags to the element', () => {
    injector.element(element)

    const expectedTags = [
      `<meta property="og:title" content="test" data-rh="true">`,
      `<meta name="description" content="testDescription" data-rh="true">`,
      `<meta property="og:description" content="testDescription" data-rh="true">`,
      `<meta property="og:image" content="testImage" data-rh="true">`,
      `<meta property="og:image:width" content="1200" data-rh="true">`,
      `<meta property="og:image:height" content="630" data-rh="true">`,
      `<meta property="og:image:alt" content="test" data-rh="true">`,
      `<meta property="og:type" content="website" data-rh="true">`,
      `<meta property="og:url" content="testUrl" data-rh="true">`,
      `<meta property="twitter:card" content="summary_large_image" data-rh="true">`,
      `<meta property="twitter:title" content="test" data-rh="true">`,
      `<meta property="twitter:image" content="testImage" data-rh="true">`,
      `<meta property="twitter:image:alt" content="test" data-rh="true">`,
    ]

    expectedTags.forEach((tag) => {
      expect(element.append).toHaveBeenCalledWith(tag, { html: true })
    })

    expect(element.append).toHaveBeenCalledTimes(expectedTags.length)
  })

  test('should append x-blocked-paths meta if present in headers', () => {
    const blockedRequest = new Request('http://localhost')
    blockedRequest.headers.set('x-blocked-paths', '/')
    const blockedInjector = new MetaTagInjector(metaData, blockedRequest)

    blockedInjector.element(element)

    expect(element.append).toHaveBeenCalledWith(
      `<meta property="x:blocked-paths" content="/" data-rh="true">`,
      { html: true }
    )
  })

  test('should prevent potential XSS via meta content', () => {
    const unsafeMetaData = {
      title: `<script>alert("xss")</script>`,
      url: 'https://safe.com',
      image: 'img.jpg',
      description: 'test',
    }

    const xssInjector = new MetaTagInjector(unsafeMetaData, new Request('http://localhost'))
    const xssElement = {
      append: jest.fn(),
    } as unknown as HTMLElement

    xssInjector.element(xssElement)

    // Assert it does not include unescaped script tag
    const calls = (xssElement.append as jest.Mock).mock.calls
    const scriptInjectionDetected = calls.some(([tag]) => tag.includes('<script>'))

    expect(scriptInjectionDetected).toBe(false)
  })
})
