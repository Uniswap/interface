import { PrecacheEntry } from 'workbox-precaching/_types'

import { splitAssetsAndEntries } from './utils'

describe('splitAssetsAndEntries', () => {
  test('splits resources into assets and entries', () => {
    const resources = [
      './static/whitepaper.pdf',
      { url: './static/js/main.js', revision: 'abc123' },
      { url: './static/css/styles.css', revision: 'def456' },
      { url: './static/media/image.jpg', revision: 'ghi789' },
      { url: '/other-page.html', revision: 'jkl012' },
    ]

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({
      assets: ['./static/whitepaper.pdf', './static/media/image.jpg'],
      entries: [
        { url: './static/js/main.js', revision: 'abc123' },
        { url: './static/css/styles.css', revision: 'def456' },
        { url: '/other-page.html', revision: 'jkl012' },
      ],
    })
  })

  test('handles empty input', () => {
    const resources: (string | PrecacheEntry)[] = []

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({ assets: [], entries: [] })
  })

  test('handles input with only ./static/whitepaper.pdf', () => {
    const resources = ['./static/whitepaper.pdf']

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({ assets: ['./static/whitepaper.pdf'], entries: [] })
  })

  test('handles input with only assets', () => {
    const resources = [
      { url: './static/media/image.jpg', revision: 'abc123' },
      { url: './static/media/image2.jpg', revision: 'abc123' },
    ]

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({
      assets: ['./static/media/image.jpg', './static/media/image2.jpg'],
      entries: [],
    })
  })

  test('handles input with only entries', () => {
    const resources = [
      { url: '/other-page.html', revision: 'abc123' },
      { url: '/about.html', revision: 'def456' },
    ]

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({ assets: [], entries: resources })
  })
})
