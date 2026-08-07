import { EMBED_VIEW_PARAM, parseEmbedView } from '~/pages/Swap/embedContext'
import { getSwapCapabilities } from '~/pages/Swap/swapCapabilities'

describe('parseEmbedView', () => {
  it('defaults to the full app when no view param is present', () => {
    expect(parseEmbedView('')).toBe('full')
    expect(parseEmbedView('?chain=base')).toBe('full')
  })

  it('resolves the explicit full opt-in to the full app', () => {
    expect(parseEmbedView('?view=full')).toBe('full')
    expect(parseEmbedView(`?${EMBED_VIEW_PARAM}=full&chain=base`)).toBe('full')
  })

  it('only the explicit view=swap opt-in selects the swap-only surface', () => {
    expect(parseEmbedView('?view=swap')).toBe('swap')
    expect(parseEmbedView(`?chain=base&${EMBED_VIEW_PARAM}=swap`)).toBe('swap')
  })

  it('treats unknown / partial view values as the default full app', () => {
    expect(parseEmbedView('?view=')).toBe('full')
    expect(parseEmbedView('?view=SWAP')).toBe('full')
    expect(parseEmbedView('?view=swapp')).toBe('full')
    expect(parseEmbedView('?view=limit')).toBe('full')
  })
})

describe('getSwapCapabilities', () => {
  it('view=full (default surface) keeps the complete app on', () => {
    expect(getSwapCapabilities('full')).toEqual({
      appChrome: true,
      header: true,
      chart: true,
      syncTabToUrl: true,
    })
  })

  it('view=swap strips to the swap-only surface (no chrome/header/chart/tab-url sync)', () => {
    expect(getSwapCapabilities('swap')).toEqual({
      appChrome: false,
      header: false,
      chart: false,
      syncTabToUrl: false,
    })
  })
})
