import { fetchSVG } from 'ui/src/components/UniversalImage/utils'
import { describe, expect, it, vi } from 'vitest'

const REGULAR_SVG = '<svg viewBox="0 0 10 20"></svg>'

const SVG_WITH_ANIMATES = '<svg viewBox="100 20 15 25"><text>hello</text><animate fill="" /></svg>'
const SVG_WITH_ANIMATES_STRIPPED = '<svg viewBox="100 20 15 25"><text>hello</text><group fill="" /></svg>'

describe(fetchSVG, () => {
  it('fetches SVGs', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(REGULAR_SVG),
      }),
    ) as any

    const result = await fetchSVG({ uri: 'regular.svg', autoplay: false })

    expect(result.content).toEqual(REGULAR_SVG)
    expect(result.aspectRatio).toEqual(10 / 20)
  })

  it('removes <animate>', async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(SVG_WITH_ANIMATES),
      }),
    ) as any

    const result = await fetchSVG({ uri: 'with-animate.svg', autoplay: false })

    expect(result.content).toEqual(SVG_WITH_ANIMATES_STRIPPED)
    expect(result.aspectRatio).toEqual(15 / 25)
  })
})
