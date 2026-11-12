import { UniverseChainId } from '@universe/chains'
import { rankedMultichainTokenToTokenItemData } from 'src/components/explore/rankedMultichainTokenToTokenItemData'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'

const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const ENABLED_CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.Base]

describe(rankedMultichainTokenToTokenItemData, () => {
  it('shows FDV, not market cap, to match the FDV sort', () => {
    const rankedToken = createRankedMultichainToken({ marketCap: 3_900_000_000, fdv: 5_600_000_000 })

    const result = rankedMultichainTokenToTokenItemData({
      rankedToken,
      selectedNetwork: null,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(result?.fdv).toBe(5_600_000_000)
  })

  it('maps the primary deployment and enabled network count', () => {
    const rankedToken = createRankedMultichainToken({
      addresses: {
        [String(UniverseChainId.Mainnet)]: USDC_MAINNET,
        [String(UniverseChainId.Base)]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        [String(UniverseChainId.Polygon)]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      },
      volume1d: 100,
      tvl: 50,
    })

    const result = rankedMultichainTokenToTokenItemData({
      rankedToken,
      selectedNetwork: UniverseChainId.Mainnet,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(result).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      address: USDC_MAINNET,
      symbol: 'USDC',
      volume24h: 100,
      totalValueLocked: 50,
      networkCount: 2,
    })
  })

  it('carries the category tags that gate stablecoin sparkline flattening', () => {
    const rankedToken = createRankedMultichainToken({})
    rankedToken.multichainToken!.categoryIds = ['stablecoins']

    const result = rankedMultichainTokenToTokenItemData({
      rankedToken,
      selectedNetwork: null,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(result?.categoryIds).toEqual(['stablecoins'])
  })

  it('returns null when the selected network has no deployment', () => {
    const rankedToken = createRankedMultichainToken({ addresses: { [String(UniverseChainId.Mainnet)]: USDC_MAINNET } })

    const result = rankedMultichainTokenToTokenItemData({
      rankedToken,
      selectedNetwork: UniverseChainId.Base,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(result).toBeNull()
  })
})
