import { fetchSVG } from 'wallet/src/features/images/utils'

const REGULAR_SVG = '<svg viewBox="0 0 10 20"></svg>'

const SVG_WITH_ANIMATES = '<svg viewBox="100 20 15 25"><text>hello</text><animate fill="" /></svg>'
const SVG_WITH_ANIMATES_STRIPPED =
  '<svg viewBox="100 20 15 25"><text>hello</text><group fill="" /></svg>'

describe(fetchSVG, () => {
  it('fetches SVGs', async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(REGULAR_SVG),
      })
    ) as jest.Mock

    const result = await fetchSVG('regular.svg', false)

    expect(result.content).toEqual(REGULAR_SVG)
    expect(result.aspectRatio).toEqual(10 / 20)
  })

  it('removes <animate>', async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(SVG_WITH_ANIMATES),
      })
    ) as jest.Mock

    const result = await fetchSVG('with-animate.svg', false)

    expect(result.content).toEqual(SVG_WITH_ANIMATES_STRIPPED)
    expect(result.aspectRatio).toEqual(15 / 25)
  })
})
