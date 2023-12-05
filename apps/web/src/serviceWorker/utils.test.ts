import { deleteUnusedCaches, groupEntries } from './utils'

describe('groupEntries', () => {
  test('splits resources into onDemandEntries and precacheEntries', () => {
    const resources = [
      './static/whitepaper.pdf',
      { url: './index.html', revision: 'abcd1234' },
      { url: './static/css/1234.abcd1234.chunk.css', revision: null },
      { url: './static/js/1234.abcd1234.chunk.js', revision: null },
      { url: './static/media/image.jpg', revision: null },
    ]

    const result = groupEntries(resources)

    expect(result).toEqual({
      onDemandEntries: [
        './static/whitepaper.pdf',
        { url: './static/css/1234.abcd1234.chunk.css', revision: null },
        { url: './static/js/1234.abcd1234.chunk.js', revision: null },
        { url: './static/media/image.jpg', revision: null },
      ],
      precacheEntries: [{ url: './index.html', revision: 'abcd1234' }],
    })
  })
})

describe('deleteUnusedCaches', () => {
  test('deletes unused caches', async () => {
    const caches = {
      keys: jest.fn().mockResolvedValue(['a', 'b', 'c']),
      delete: jest.fn(),
    } as unknown as CacheStorage
    await deleteUnusedCaches(caches, { usedCaches: ['a', 'b'] })

    expect(caches.delete).not.toHaveBeenCalledWith('a')
    expect(caches.delete).not.toHaveBeenCalledWith('b')
    expect(caches.delete).toHaveBeenCalledWith('c')
  })
})
