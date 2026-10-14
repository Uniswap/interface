import Cache, { Data } from 'functions/utils/cache'

const data: Data = {
  title: 'test',
  image: 'testImage',
  url: 'testUrl',
}

afterEach(() => {
  vi.useRealTimers()
})

test('Should put and match cache properly', async () => {
  await Cache.put(data, 'https://example.com')
  await expect(Cache.match('https://example.com')).resolves.toStrictEqual(data)
})

test('Should return undefined for a missing entry', async () => {
  await expect(Cache.match('https://missing.example.com')).resolves.toBeUndefined()
})

test('Should expire entries after one week', async () => {
  vi.useFakeTimers()
  await Cache.put(data, 'https://expiring.example.com')
  vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 1)
  await expect(Cache.match('https://expiring.example.com')).resolves.toBeUndefined()
})

test('Should return undefined if not all data is present', async () => {
  await Cache.put({ ...data, title: '' }, 'https://partial.example.com')
  await expect(Cache.match('https://partial.example.com')).resolves.toBeUndefined()
})
