import { MetaTagInjector } from './metaTagInjector'

test('should append meta tag to element', () => {
  const element = {
    append: jest.fn(),
  } as unknown as Element
  const property = 'property'
  const content = 'content'
  const injector = new MetaTagInjector(
    {
      title: 'test',
      url: 'testUrl',
      image: 'testImage',
      description: 'testDescription',
    },
    new Request('http://localhost')
  )
  injector.append(element, property, content)
  expect(element.append).toHaveBeenCalledWith(`<meta property="${property}" content="${content}"/>`, { html: true })

  injector.element(element)
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:title" content="test"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:description" content="testDescription"/>`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image" content="testImage"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image:width" content="1200"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image:height" content="630"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image:alt" content="test"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:type" content="website"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:url" content="testUrl"/>`, { html: true })

  expect(element.append).toHaveBeenCalledWith(`<meta property="twitter:card" content="summary_large_image"/>`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="twitter:title" content="test"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="twitter:image" content="testImage"/>`, { html: true })
  expect(element.append).toHaveBeenCalledWith(`<meta property="twitter:image:alt" content="test"/>`, { html: true })

  expect(element.append).toHaveBeenCalledTimes(13)
})

test('should pass through header blocked paths', () => {
  const element = {
    append: jest.fn(),
  } as unknown as Element
  const request = new Request('http://localhost')
  request.headers.set('x-blocked-paths', '/')
  const injector = new MetaTagInjector(
    {
      title: 'test',
      url: 'testUrl',
      image: 'testImage',
      description: 'testDescription',
    },
    request
  )
  injector.element(element)
  expect(element.append).toHaveBeenCalledWith(`<meta property="x:blocked-paths" content="/"/>`, { html: true })
})
