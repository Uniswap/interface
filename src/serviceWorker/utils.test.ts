import { groupEntries } from './utils'

describe('groupEntries', () => {
  test('splits resources into mediaURLs and precacheEntries', () => {
    const resources = [
      { url: './static/js/main.js', revision: 'abc123' },
      { url: './static/css/styles.css', revision: 'def456' },
      { url: './static/media/image.jpg', revision: 'ghi789' },
    ]

    const result = groupEntries(resources)

    expect(result).toEqual({
      mediaURLs: ['./static/media/image.jpg'],
      precacheEntries: [
        { url: './static/js/main.js', revision: 'abc123' },
        { url: './static/css/styles.css', revision: 'def456' },
      ],
    })
  })
})
