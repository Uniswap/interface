import CacheMock from 'browser-cache-mock'

import Cache, { Data } from 'functions/utils/cache'
import { mocked } from 'src/test-utils/mocked'

const cacheMock = new CacheMock()

const data: Data = {
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
  vi.spyOn(cacheMock, 'put')
  await Cache.put(data, 'https://example.com')
  expect(cacheMock.put).toHaveBeenCalledWith('https://example.com', expect.anything())
  const call = mocked(cacheMock.put).mock.calls[0]
  const response = JSON.parse(await (call[1] as Response).clone().text())
  expect(response).toStrictEqual(data)

  await expect(Cache.match('https://example.com')).resolves.toStrictEqual(data)
})

test('Should match cache properly', async () => {
  vi.spyOn(cacheMock, 'match').mockResolvedValueOnce(new Response(JSON.stringify(data)))
  const response = await Cache.match('https://example.com')
  expect(response).toStrictEqual(data)
})

test('Should return undefined if not all data is present', async () => {
  vi.spyOn(cacheMock, 'match').mockResolvedValueOnce(new Response(JSON.stringify({ ...data, title: undefined })))
  const response = await Cache.match('https://example.com')
  expect(response).toBeUndefined()
})
