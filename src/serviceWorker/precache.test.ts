import { PrecacheEntry } from 'workbox-precaching/_types'

import { filterPrecacheEntries } from './precache'

describe('precache', () => {
  describe('filterPrecacheEntries', () => {
    const TEST_ASSETS = [
      [
        {
          url: 'index.html',
        },
        true,
      ],
      ['inter-roman.var.woff2', true],
      ['comicsans.woff2', false],
      ['main.12345.chunk.js', true],
    ] as [PrecacheEntry | string, boolean][]

    it.each(TEST_ASSETS)('%s', (entry: PrecacheEntry | string, expected: boolean) => {
      expect(filterPrecacheEntries(entry)).toBe(expected)
    })
  })
})
