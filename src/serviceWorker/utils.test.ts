import { PrecacheEntry } from 'workbox-precaching/_types'

import { groupEntries } from './utils'

describe('groupEntries', () => {
  test('splits resources into onDemandCacheEntries and precacheEntries', () => {
    const resources = [
      './static/whitepaper.pdf',
      { url: './static/js/main.js', revision: 'abc123' },
      { url: './static/css/styles.css', revision: 'def456' },
      { url: './static/media/image.jpg', revision: 'ghi789' },
      { url: '/other-page.html', revision: 'jkl012' },
    ]

    const result = groupEntries(resources)

    expect(result).toEqual({
      onDemandCacheEntries: ['./static/whitepaper.pdf', './static/media/image.jpg'],
      precacheEntries: [
        { url: './static/js/main.js', revision: 'abc123' },
        { url: './static/css/styles.css', revision: 'def456' },
        { url: '/other-page.html', revision: 'jkl012' },
      ],
    })
  })

  test('handles empty input', () => {
    const resources: (string | PrecacheEntry)[] = []

    const result = groupEntries(resources)

    expect(result).toEqual({ onDemandCacheEntries: [], precacheEntries: [] })
  })

  test('handles input with only ./static/whitepaper.pdf', () => {
    const resources = ['./static/whitepaper.pdf']

    const result = groupEntries(resources)

    expect(result).toEqual({ onDemandCacheEntries: ['./static/whitepaper.pdf'], precacheEntries: [] })
  })

  test('handles input with only onDemandCacheEntries', () => {
    const resources = [
      { url: './static/media/image.jpg', revision: 'abc123' },
      { url: './static/media/image2.jpg', revision: 'abc123' },
    ]

    const result = groupEntries(resources)

    expect(result).toEqual({
      onDemandCacheEntries: ['./static/media/image.jpg', './static/media/image2.jpg'],
      precacheEntries: [],
    })
  })

  test('handles input with only precacheEntries', () => {
    const resources = [
      { url: '/other-page.html', revision: 'abc123' },
      { url: '/about.html', revision: 'def456' },
    ]

    const result = groupEntries(resources)

    expect(result).toEqual({ onDemandCacheEntries: [], precacheEntries: resources })
  })
})
