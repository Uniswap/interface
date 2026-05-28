import { GraphQLApi } from '@universe/api'
import getNetworkLogoUrl, { OG_NETWORK_BADGE_CHAINS } from 'functions/utils/getNetworkLogoURL'

/**
 * Guardrail: OG network badges depend on Vite inlining `*.png?inline` from `packages/ui`
 * into the Cloudflare worker bundle. Missing assets, path refactors, or broken asset
 * handling regress to empty/wrong URLs at runtime — this fails early in CI.
 */
describe('getNetworkLogoUrl — UI ?inline / worker build coupling', () => {
  it('every OG badge chain resolves to a PNG data URL inlined from packages/ui', () => {
    for (const chain of OG_NETWORK_BADGE_CHAINS) {
      const src = getNetworkLogoUrl(chain, 'https://app.uniswap.org')
      expect(src, `${chain}: expected Vite ?inline of ui logos/png; check asset path and worker bundler`).toMatch(
        /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/,
      )
      expect(src.length).toBeGreaterThan(500)
    }
  })

  it('returns empty for chains that do not ship an OG badge', () => {
    expect(getNetworkLogoUrl(GraphQLApi.Chain.Ethereum, '')).toBe('')
    expect(getNetworkLogoUrl(GraphQLApi.Chain.Solana, '')).toBe('')
    expect(getNetworkLogoUrl('NOT_A_REAL_CHAIN', '')).toBe('')
  })
})
