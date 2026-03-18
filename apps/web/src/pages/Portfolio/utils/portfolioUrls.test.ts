import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  SAMPLE_SEED_ADDRESS_3,
  SAMPLE_SEED_ADDRESS_4,
} from 'uniswap/src/test/fixtures/gql/assets/constants'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl, pathToPortfolioTab } from '~/pages/Portfolio/utils/portfolioUrls'

describe('buildPortfolioUrl', () => {
  describe('with no parameters', () => {
    it('should return base portfolio path', () => {
      expect(buildPortfolioUrl({})).toBe('/portfolio')
    })
  })

  describe('with tab only', () => {
    it('should return base path for Overview tab', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Overview })).toBe('/portfolio')
    })

    it('should return base path when tab is undefined', () => {
      expect(buildPortfolioUrl({ tab: undefined })).toBe('/portfolio')
    })

    it('should return tokens path for Tokens tab', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Tokens })).toBe('/portfolio/tokens')
    })

    it('should return defi path for Defi tab', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Defi })).toBe('/portfolio/defi')
    })

    it('should return nfts path for Nfts tab', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Nfts })).toBe('/portfolio/nfts')
    })

    it('should return activity path for Activity tab', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Activity })).toBe('/portfolio/activity')
    })
  })

  describe('with chainId only', () => {
    it('should append chain query param for Ethereum', () => {
      expect(buildPortfolioUrl({ chainId: UniverseChainId.Mainnet })).toBe('/portfolio?chain=ethereum')
    })

    it('should append chain query param for Arbitrum', () => {
      expect(buildPortfolioUrl({ chainId: UniverseChainId.ArbitrumOne })).toBe('/portfolio?chain=arbitrum')
    })

    it('should append chain query param for Optimism', () => {
      expect(buildPortfolioUrl({ chainId: UniverseChainId.Optimism })).toBe('/portfolio?chain=optimism')
    })

    it('should append chain query param for Base', () => {
      expect(buildPortfolioUrl({ chainId: UniverseChainId.Base })).toBe('/portfolio?chain=base')
    })
  })

  describe('with externalAddress only', () => {
    it('should return external wallet path with address', () => {
      expect(buildPortfolioUrl({ externalAddress: SAMPLE_SEED_ADDRESS_1 })).toBe(`/portfolio/${SAMPLE_SEED_ADDRESS_1}`)
    })
  })

  describe('with tab and chainId', () => {
    it('should return tab path with chain param for Tokens on Ethereum', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Tokens, chainId: UniverseChainId.Mainnet })).toBe(
        '/portfolio/tokens?chain=ethereum',
      )
    })

    it('should return tab path with chain param for Activity on Arbitrum', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Activity, chainId: UniverseChainId.ArbitrumOne })).toBe(
        '/portfolio/activity?chain=arbitrum',
      )
    })

    it('should return base path with chain param for Overview tab', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Overview, chainId: UniverseChainId.Optimism })).toBe(
        '/portfolio?chain=optimism',
      )
    })
  })

  describe('with tab and externalAddress', () => {
    it('should return external wallet tokens path', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Tokens, externalAddress: SAMPLE_SEED_ADDRESS_2 })).toBe(
        `/portfolio/${SAMPLE_SEED_ADDRESS_2}/tokens`,
      )
    })

    it('should return external wallet activity path', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Activity, externalAddress: SAMPLE_SEED_ADDRESS_2 })).toBe(
        `/portfolio/${SAMPLE_SEED_ADDRESS_2}/activity`,
      )
    })

    it('should return external wallet base path for Overview tab', () => {
      expect(buildPortfolioUrl({ tab: PortfolioTab.Overview, externalAddress: SAMPLE_SEED_ADDRESS_2 })).toBe(
        `/portfolio/${SAMPLE_SEED_ADDRESS_2}`,
      )
    })

    it('should return external wallet base path when tab is undefined', () => {
      expect(buildPortfolioUrl({ tab: undefined, externalAddress: SAMPLE_SEED_ADDRESS_2 })).toBe(
        `/portfolio/${SAMPLE_SEED_ADDRESS_2}`,
      )
    })
  })

  describe('with chainId and externalAddress', () => {
    it('should return external wallet path with chain param', () => {
      expect(buildPortfolioUrl({ chainId: UniverseChainId.Base, externalAddress: SAMPLE_SEED_ADDRESS_3 })).toBe(
        `/portfolio/${SAMPLE_SEED_ADDRESS_3}?chain=base`,
      )
    })
  })

  describe('with all parameters', () => {
    it('should return external wallet tab path with chain param', () => {
      expect(
        buildPortfolioUrl({
          tab: PortfolioTab.Nfts,
          chainId: UniverseChainId.Mainnet,
          externalAddress: SAMPLE_SEED_ADDRESS_4,
        }),
      ).toBe(`/portfolio/${SAMPLE_SEED_ADDRESS_4}/nfts?chain=ethereum`)
    })

    it('should return external wallet overview path with chain param for Overview tab', () => {
      expect(
        buildPortfolioUrl({
          tab: PortfolioTab.Overview,
          chainId: UniverseChainId.ArbitrumOne,
          externalAddress: SAMPLE_SEED_ADDRESS_4,
        }),
      ).toBe(`/portfolio/${SAMPLE_SEED_ADDRESS_4}?chain=arbitrum`)
    })

    it('should return external wallet defi path with chain param', () => {
      expect(
        buildPortfolioUrl({
          tab: PortfolioTab.Defi,
          chainId: UniverseChainId.Optimism,
          externalAddress: SAMPLE_SEED_ADDRESS_4,
        }),
      ).toBe(`/portfolio/${SAMPLE_SEED_ADDRESS_4}/defi?chain=optimism`)
    })
  })
})

describe('pathToPortfolioTab', () => {
  describe('direct path matches', () => {
    it('should return Overview for /portfolio', () => {
      expect(pathToPortfolioTab('/portfolio')).toBe(PortfolioTab.Overview)
    })

    it('should return Tokens for /portfolio/tokens', () => {
      expect(pathToPortfolioTab('/portfolio/tokens')).toBe(PortfolioTab.Tokens)
    })

    it('should return Defi for /portfolio/defi', () => {
      expect(pathToPortfolioTab('/portfolio/defi')).toBe(PortfolioTab.Defi)
    })

    it('should return Nfts for /portfolio/nfts', () => {
      expect(pathToPortfolioTab('/portfolio/nfts')).toBe(PortfolioTab.Nfts)
    })

    it('should return Activity for /portfolio/activity', () => {
      expect(pathToPortfolioTab('/portfolio/activity')).toBe(PortfolioTab.Activity)
    })
  })

  describe('external wallet paths', () => {
    it('should return Overview for external wallet base path', () => {
      expect(pathToPortfolioTab(`/portfolio/${SAMPLE_SEED_ADDRESS_1}`)).toBe(PortfolioTab.Overview)
    })

    it('should return Tokens for external wallet tokens path', () => {
      expect(pathToPortfolioTab(`/portfolio/${SAMPLE_SEED_ADDRESS_1}/tokens`)).toBe(PortfolioTab.Tokens)
    })

    it('should return Defi for external wallet defi path', () => {
      expect(pathToPortfolioTab(`/portfolio/${SAMPLE_SEED_ADDRESS_1}/defi`)).toBe(PortfolioTab.Defi)
    })

    it('should return Nfts for external wallet nfts path', () => {
      expect(pathToPortfolioTab(`/portfolio/${SAMPLE_SEED_ADDRESS_1}/nfts`)).toBe(PortfolioTab.Nfts)
    })

    it('should return Activity for external wallet activity path', () => {
      expect(pathToPortfolioTab(`/portfolio/${SAMPLE_SEED_ADDRESS_1}/activity`)).toBe(PortfolioTab.Activity)
    })
  })

  describe('invalid paths', () => {
    it('should return undefined for empty string', () => {
      expect(pathToPortfolioTab('')).toBeUndefined()
    })

    it('should return undefined for root path', () => {
      expect(pathToPortfolioTab('/')).toBeUndefined()
    })

    it('should return undefined for unrelated paths', () => {
      expect(pathToPortfolioTab('/swap')).toBeUndefined()
      expect(pathToPortfolioTab('/explore')).toBeUndefined()
      expect(pathToPortfolioTab('/tokens')).toBeUndefined()
    })

    it('should return undefined for invalid tab in standard path', () => {
      expect(pathToPortfolioTab('/portfolio/invalid')).toBeUndefined()
    })

    it('should return undefined for invalid tab in external wallet path', () => {
      expect(pathToPortfolioTab(`/portfolio/${SAMPLE_SEED_ADDRESS_1}/invalid`)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle paths with trailing slashes via segment parsing fallback', () => {
      // The direct match fails for '/portfolio/tokens/' but the segment parsing
      // via filter(Boolean) removes empty strings, so ['portfolio', 'tokens']
      // still resolves to Tokens tab via the fallback logic
      expect(pathToPortfolioTab('/portfolio/tokens/')).toBe(PortfolioTab.Tokens)
    })

    it('should handle addresses that dont start with 0x as non-address segments', () => {
      // 'not-an-address' is not a valid tab, so should return undefined
      expect(pathToPortfolioTab('/portfolio/not-an-address')).toBeUndefined()
    })

    it('should return undefined for short/invalid 0x addresses', () => {
      // These are not valid 42-character EVM addresses
      expect(pathToPortfolioTab('/portfolio/0xabcdef')).toBeUndefined()
      expect(pathToPortfolioTab('/portfolio/0xAbCdEf1234567890')).toBeUndefined()
      expect(pathToPortfolioTab('/portfolio/0x')).toBeUndefined()
    })

    it('should handle valid EVM addresses', () => {
      expect(pathToPortfolioTab('/portfolio/0x82D56A352367453f74FC0dC7B071b311da373Fa6')).toBe(PortfolioTab.Overview)
    })

    it('should handle valid SVM addresses', () => {
      // Valid Solana address (base58 encoded, 32 bytes)
      expect(pathToPortfolioTab('/portfolio/7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs')).toBe(PortfolioTab.Overview)
    })

    it('should handle SVM addresses with tab', () => {
      expect(pathToPortfolioTab('/portfolio/7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs/tokens')).toBe(
        PortfolioTab.Tokens,
      )
    })
  })
})
