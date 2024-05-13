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
  expect(element.append).toHaveBeenCalledWith(`<meta property="${property}" content="${content}" data-rh="true">`, {
    html: true,
  })

  injector.element(element)
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:title" content="test" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(
    `<meta property="og:description" content="testDescription" data-rh="true">`,
    {
      html: true,
    }
  )
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image" content="testImage" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image:width" content="1200" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image:height" content="630" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:image:alt" content="test" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:type" content="website" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="og:url" content="testUrl" data-rh="true">`, {
    html: true,
  })

  expect(element.append).toHaveBeenCalledWith(
    `<meta property="twitter:card" content="summary_large_image" data-rh="true">`,
    {
      html: true,
    }
  )
  expect(element.append).toHaveBeenCalledWith(`<meta property="twitter:title" content="test" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="twitter:image" content="testImage" data-rh="true">`, {
    html: true,
  })
  expect(element.append).toHaveBeenCalledWith(`<meta property="twitter:image:alt" content="test" data-rh="true">`, {
    html: true,
  })

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
  expect(element.append).toHaveBeenCalledWith(`<meta property="x:blocked-paths" content="/" data-rh="true">`, {
    html: true,
  })
})
