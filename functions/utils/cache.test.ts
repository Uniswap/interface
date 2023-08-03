import CacheMock from 'browser-cache-mock'

import Cache from './cache'

const cacheMock = new CacheMock()

beforeAll(() => {
  const globalAny: any = global
  globalAny.caches = {
    open: async () => cacheMock,
    ...cacheMock,
  }
})

test('Should use cache properly', async () => {
  //wait for the server to start
  const url = 'http://127.0.0.1:3000/'
  await fetch(new Request(url)).then((res) => res.text())

  let response = await Cache.match('https://example.com', 'test-cache')
  expect(response).toBeUndefined()
  const data = JSON.stringify({
    title: 'test',
    image: 'testImage',
    url: 'testUrl',
  })
  await Cache.put(new Response(JSON.stringify(data)), 'https://example.com', 'test-cache')
  response = await Cache.match('https://example.com', 'test-cache')
  expect(response).toBe(data)
})
