import { PrecacheEntry } from 'workbox-precaching/_types'

import { splitAssetsAndEntries } from './index'

describe('splitAssetsAndEntries', () => {
  test('splits resources into assets and entries', () => {
    const resources = [
      'index.html',
      { url: '/main.js', revision: 'abc123' },
      { url: '/styles.css', revision: 'def456' },
      { url: '/media/image.jpg', revision: 'ghi789' },
      { url: '/other-page.html', revision: 'jkl012' },
    ]

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({
      assets: ['/media/image.jpg', '/main.js', '/styles.css'],
      entries: [
        { url: '/main.js', revision: 'abc123' },
        { url: '/styles.css', revision: 'def456' },
        { url: '/other-page.html', revision: 'jkl012' },
      ],
    })
  })

  test('handles empty input', () => {
    const resources: (string | PrecacheEntry)[] = []

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({ assets: [], entries: [] })
  })

  test('handles input with only index.html', () => {
    const resources = ['index.html']

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({ assets: ['index.html'], entries: [] })
  })

  test('handles input with only assets', () => {
    const resources = [
      { url: '/media/image.jpg', revision: 'abc123' },
      { url: '/main.js', revision: 'def456' },
      { url: '/styles.css', revision: 'ghi789' },
    ]

    const result = splitAssetsAndEntries(resources)

    expect(result).toEqual({
      assets: ['/media/image.jpg', '/main.js', '/styles.css'],
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
