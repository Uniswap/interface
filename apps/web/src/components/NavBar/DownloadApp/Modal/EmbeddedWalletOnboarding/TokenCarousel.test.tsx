import { renderToStaticMarkup } from 'react-dom/server'
import { TokenCarousel } from '~/components/NavBar/DownloadApp/Modal/EmbeddedWalletOnboarding/TokenCarousel'

vi.mock('uniswap/src/components/CurrencyLogo/TokenLogo', () => ({
  TokenLogo: () => null,
}))

describe('TokenCarousel', () => {
  // jsdom's CSSStyleDeclaration drops gradient values, so the fade is read off the server-rendered markup.
  it('paints the edge fade from colors the web theme defines', () => {
    const html = renderToStaticMarkup(<TokenCarousel />)
    const gradient = html.match(/linear-gradient\([^;"]*\)/)?.[0]

    expect(gradient).toBeDefined()
    expect(gradient).toContain('var(--surface1)')
    expect(gradient).toContain('transparent')
    expect(gradient).not.toContain('var(--transparent)')
  })
})
