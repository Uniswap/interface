import { groupEntries } from './utils'

describe('groupEntries', () => {
  test('splits resources into onDemandEntries and precacheEntries', () => {
    const resources = [
      './static/whitepaper.pdf',
      { url: './static/js/main.js', revision: 'abc123' },
      { url: './static/css/styles.css', revision: 'def456' },
      { url: './static/media/image.jpg', revision: 'ghi789' },
    ]

    const result = groupEntries(resources)

    expect(result).toEqual({
      onDemandEntries: ['./static/whitepaper.pdf', { url: './static/media/image.jpg', revision: 'ghi789' }],
      precacheEntries: [
        { url: './static/js/main.js', revision: 'abc123' },
        { url: './static/css/styles.css', revision: 'def456' },
      ],
    })
  })
})
