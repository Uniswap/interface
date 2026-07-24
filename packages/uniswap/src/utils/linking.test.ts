import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  ExplorerDataType,
  getEarnVaultUrl,
  getExplorerLink,
  getFiatOnRampURL,
  getTokenDetailsURL,
  getTokenUrl,
  TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
  tdpChainSelectionFromFilter,
  TdpChainSelectionType,
  TDPView,
} from 'uniswap/src/utils/linking'

const earnVault = {
  displayCurrencyId: `${UniverseChainId.Base}-0x4200000000000000000000000000000000000006`,
} as EarnVaultInfo

describe(getExplorerLink, () => {
  it('handles different link cases', () => {
    expect(
      getExplorerLink({ chainId: UniverseChainId.ArbitrumOne, data: 'hash', type: ExplorerDataType.TRANSACTION }),
    ).toEqual('https://arbiscan.io/tx/hash')
    expect(getExplorerLink({ chainId: UniverseChainId.Mainnet, data: 'hash', type: ExplorerDataType.ADDRESS })).toEqual(
      'https://etherscan.io/address/hash',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Polygon, data: 'hash', type: ExplorerDataType.TOKEN })).toEqual(
      'https://polygonscan.com/token/hash',
    )
  })

  it('handles chain with explorer URL', () => {
    expect(
      getExplorerLink({ chainId: UniverseChainId.Sepolia, data: 'hash', type: ExplorerDataType.TRANSACTION }),
    ).toEqual('https://sepolia.etherscan.io/tx/hash')
  })

  it('handles Optimism block special case', () => {
    expect(getExplorerLink({ chainId: UniverseChainId.Optimism, data: 'hash', type: ExplorerDataType.BLOCK })).toEqual(
      'https://optimistic.etherscan.io/tx/hash',
    )
  })

  it('handles native currency', () => {
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.NATIVE })).toEqual(
      'https://basescan.org/',
    )
  })

  it('returns prefix if no data', () => {
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.ADDRESS })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.TOKEN })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.BLOCK })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.TRANSACTION })).toEqual(
      'https://basescan.org/',
    )
    expect(getExplorerLink({ chainId: UniverseChainId.Base, type: ExplorerDataType.NFT })).toEqual(
      'https://basescan.org/',
    )
  })

  it('returns empty string for unsupported chain IDs', () => {
    // Test with an unsupported chain ID (e.g., a random chain ID that might come from a dapp)
    const unsupportedChainId = 999999 as UniverseChainId
    expect(getExplorerLink({ chainId: unsupportedChainId, data: 'hash', type: ExplorerDataType.TRANSACTION })).toEqual(
      '',
    )
    expect(getExplorerLink({ chainId: unsupportedChainId, type: ExplorerDataType.ADDRESS })).toEqual('')
  })
})

describe(getFiatOnRampURL, () => {
  it('returns the base buy URL when no params are provided', () => {
    expect(getFiatOnRampURL()).toEqual('/buy')
  })

  it('accepts a bare chainId for backwards compatibility', () => {
    expect(getFiatOnRampURL(UniverseChainId.Unichain)).toEqual('/buy?chainId=130')
  })

  it('serializes chainId, currencyCode, and currencyId for prefilled FOR navigation', () => {
    expect(
      getFiatOnRampURL({
        chainId: UniverseChainId.Unichain,
        currencyCode: 'ETH',
        currencyId: `${UniverseChainId.Unichain}-0x0000000000000000000000000000000000000000`,
      }),
    ).toEqual('/buy?chainId=130&currencyCode=ETH&currencyId=130-0x0000000000000000000000000000000000000000')
  })

  it('omits unset params from the query string', () => {
    expect(getFiatOnRampURL({ currencyCode: 'ETH' })).toEqual('/buy?currencyCode=ETH')
  })
})

describe(getEarnVaultUrl, () => {
  it('includes the source entry point in the web vault URL', () => {
    expect(getEarnVaultUrl(earnVault, EarnEntryPoint.PortfolioEarnSection)).toEqual(
      'https://app.uniswap.org/explore/tokens/base/0x4200000000000000000000000000000000000006?modal=earn-vault&earnEntryPoint=portfolio_earn_section',
    )
  })
})

describe(getTokenDetailsURL, () => {
  it('returns aggregate multichain TDP URL when requested', () => {
    expect(
      getTokenDetailsURL({
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chain: UniverseChainId.Mainnet,
        tdpView: TDPView.Aggregate,
      }),
    ).toEqual(
      `/explore/tokens/ethereum/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48?chain=${TDP_MULTICHAIN_CHAIN_QUERY_VALUE}`,
    )
  })
})

describe(tdpChainSelectionFromFilter, () => {
  it('maps null to the aggregate multichain selection', () => {
    expect(tdpChainSelectionFromFilter(null)).toEqual({ type: TdpChainSelectionType.Multichain })
  })

  it('maps undefined to no selection (token default)', () => {
    expect(tdpChainSelectionFromFilter(undefined)).toBeUndefined()
  })

  it('maps a chain id to a chain selection', () => {
    expect(tdpChainSelectionFromFilter(UniverseChainId.Base)).toEqual({
      type: TdpChainSelectionType.Chain,
      chainId: UniverseChainId.Base,
    })
  })
})

describe(getTokenUrl, () => {
  it('returns a chain-specific token URL by default', () => {
    expect(getTokenUrl(`${UniverseChainId.Base}-0x4200000000000000000000000000000000000006`)).toEqual(
      'https://app.uniswap.org/explore/tokens/base/0x4200000000000000000000000000000000000006',
    )
  })

  it('preserves mobile UTM tags on chain-specific token URLs', () => {
    expect(
      getTokenUrl(`${UniverseChainId.Base}-0x4200000000000000000000000000000000000006`, {
        addMobileUTMTags: true,
      }),
    ).toEqual(
      'https://app.uniswap.org/explore/tokens/base/0x4200000000000000000000000000000000000006?utm_medium=mobile&utm_source=share-tdp',
    )
  })
})
