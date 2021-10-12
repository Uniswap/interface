import { MemoryCache } from './memoryCache'

function setDate(date: number) {
  Date.now = jest.fn(() => date)
}

describe('MemoryCache', () => {
  describe('#get', () => {
    describe('without ttl', () => {
      it('gets value for hit', async () => {
        const cache = new MemoryCache()
        cache.set('key', 1)

        expect(await cache.get('key')).toBe(1)
      })

      it('gracefully fails for miss', async () => {
        const cache = new MemoryCache()

        expect(await cache.get('key')).toBeUndefined()
      })
    })

    describe('with ttl', () => {
      it('gets value', async () => {
        const cache = new MemoryCache(1000)

        // create first entry
        setDate(1)
        cache.set('key', 1)

        // create second entry
        setDate(500)
        cache.set('key2', 2)

        expect(await cache.get('key')).toBe(1)
        expect(await cache.get('key2')).toBe(2)
        expect(await cache.get('invalidKey')).toBeUndefined()

        // invalidate first entry
        setDate(1250)

        expect(await cache.get('key')).toBeUndefined()
        expect(await cache.get('key2')).toBe(2)
        expect(await cache.get('invalidKey')).toBeUndefined()

        // invalidate second entry
        setDate(2000)

        expect(await cache.get('key')).toBeUndefined()
        expect(await cache.get('key2')).toBeUndefined()
        expect(await cache.get('invalidKey')).toBeUndefined()
      })
    })
  })

  describe('#set', () => {
    it('sets a value', async () => {
      const cache = new MemoryCache()

      const ret = cache.set('key', 1)

      expect(await cache.get('key')).toBe(1)
      expect(ret).toBeTruthy()
    })

    it('sets a value with ttl', async () => {
      setDate(1)
      const cache = new MemoryCache(1000)

      const ret = cache.set('key', 1)
      const val = await cache.get('key')

      expect(val).toBe(1)
      expect(ret).toBeTruthy()
    })
  })
})
