import { fetchSVG } from 'src/components/images/utils'

const REGULAR_SVG = '<svg viewBox="0 0 10 20"></svg>'

const SVG_WITH_ANIMATES = '<svg viewBox="100 20 15 25"><text>hello</text><animate fill="" /></svg>'
const SVG_WITH_ANIMATES_STRIPPED =
  '<svg viewBox="100 20 15 25"><text>hello</text><group fill="" /></svg>'

describe(fetchSVG, () => {
  it('fetches SVGs', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(REGULAR_SVG),
      })
    ) as jest.Mock

    const result = await fetchSVG('regular.svg')

    expect(result.content).toEqual(REGULAR_SVG)
    expect(result.viewboxWidth).toEqual(10)
    expect(result.viewboxHeight).toEqual(20)
  })

  it('removes <animate>', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: () => Promise.resolve(SVG_WITH_ANIMATES),
      })
    ) as jest.Mock

    const result = await fetchSVG('with-animate.svg')

    expect(result.content).toEqual(SVG_WITH_ANIMATES_STRIPPED)
    expect(result.viewboxWidth).toEqual(15)
    expect(result.viewboxHeight).toEqual(25)
  })
})
