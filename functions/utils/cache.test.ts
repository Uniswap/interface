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

test('Should put cache properly', async () => {
  //wait for the server to start
  const url = 'http://127.0.0.1:3000/'
  await fetch(new Request(url)).then((res) => res.text())

  const response = await Cache.match('https://example.com')
  expect(response).toBeUndefined()
  const data = {
    title: 'test',
    image: 'testImage',
    url: 'testUrl',
  }
  await Cache.put(data, 'https://example.com')
})

test('Should match cache properly', async () => {
  //wait for the server to start
  const url = 'http://127.0.0.1:3000/'
  await fetch(new Request(url)).then((res) => res.text())

  const response = await Cache.match('https://example.com')
  const data = {
    title: 'test',
    image: 'testImage',
    url: 'testUrl',
  }
  expect(response).toStrictEqual(data)
})
