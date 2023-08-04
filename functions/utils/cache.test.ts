import CacheMock from 'browser-cache-mock'

//import { mocked } from '../../src/test-utils/mocked'
import Cache from './cache'

const cacheMock = new CacheMock()

const data = {
  title: 'test',
  image: 'testImage',
  url: 'testUrl',
}

beforeAll(() => {
  const globalAny: any = global
  globalAny.caches = {
    open: async () => cacheMock,
    ...cacheMock,
  }
})

test('Should put cache properly', async () => {
  jest.spyOn(cacheMock, 'put')
  const response = await Cache.match('https://example.com')
  expect(response).toBeUndefined()
  await Cache.put(data, 'https://example.com')
  expect(cacheMock.put).toHaveBeenCalledWith('https://example.com', expect.anything())

  const response2 = await Cache.match('https://example.com')
  expect(response2).toStrictEqual(data)
})

test('Should match cache properly', async () => {
  jest.spyOn(cacheMock, 'match').mockResolvedValueOnce(new Response(JSON.stringify(data)))
  const response = await Cache.match('https://example.com')
  expect(response).toStrictEqual(data)
})
