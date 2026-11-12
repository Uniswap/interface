import { UniverseChainId } from '@universe/chains'
import * as WebBrowser from 'expo-web-browser'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { openURL } from 'uniswap/src/utils/link'
import {
  ExplorerDataType,
  getEarnVaultUrl,
  getExplorerLink,
  getFiatOnRampURL,
  getHookDetailsURL,
  getTokenDetailsURL,
  getTokenUrl,
  openUri,
  TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
  tdpChainSelectionFromFilter,
  TdpChainSelectionType,
  TDPView,
} from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

vi.mock('expo-web-browser', () => ({
  openBrowserAsync: vi.fn(),
  WebBrowserPresentationStyle: { FULL_SCREEN: 'fullScreen' },
}))

vi.mock('uniswap/src/utils/link', () => ({
  openURL: vi.fn(),
  canOpenURL: vi.fn(),
}))

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

  it('serializes a fiat amount', () => {
    expect(getFiatOnRampURL({ currencyId: '1-0xabc', fiatAmount: '50' })).toEqual('/buy?currencyId=1-0xabc&value=50')
  })
})

describe(getEarnVaultUrl, () => {
  it('includes the source entry point in the web vault URL', () => {
    expect(getEarnVaultUrl(earnVault, EarnEntryPoint.PortfolioEarnSection)).toEqual(
      'https://app.uniswap.org/explore/tokens/base/0x4200000000000000000000000000000000000006?modal=earn-vault&earnEntryPoint=portfolio_earn_section',
    )
  })
})

describe(getHookDetailsURL, () => {
  const hookAddress = '0x000000000000000000000000000000000000ABcD'

  it.each([
    [UniverseChainId.Mainnet, 'ethereum'],
    [UniverseChainId.Base, 'base'],
    [UniverseChainId.ArbitrumOne, 'arbitrum'],
  ] as const)('builds a clean canonical URL for chain %s', (chainId, chainName) => {
    expect(getHookDetailsURL({ hookAddress, chainId })).toBe(`/explore/hooks/${chainName}/${hookAddress}`)
  })

  it.each([HookDetailsReferrer.List, HookDetailsReferrer.Badge] as const)(
    'encodes the declared %s origin in the scoped query parameter',
    (referrer) => {
      expect(getHookDetailsURL({ hookAddress, chainId: UniverseChainId.Base, referrer })).toBe(
        `/explore/hooks/base/${hookAddress}?hookReferrer=${referrer}`,
      )
    },
  )
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

describe(openUri, () => {
  const uri = 'https://app.uniswap.org'
  const noBrowserError = new Error('No matching browser activity found')

  beforeEach(() => {
    vi.mocked(WebBrowser.openBrowserAsync).mockReset()
    vi.mocked(openURL).mockReset()
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the in-app browser without touching the fallback', async () => {
    vi.mocked(WebBrowser.openBrowserAsync).mockResolvedValue({ type: 'opened' } as WebBrowser.WebBrowserResult)

    await openUri({ uri, isSafeUri: true })

    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(uri, expect.any(Object))
    expect(openURL).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('falls back to openURL when Android has no browser activity', async () => {
    vi.mocked(WebBrowser.openBrowserAsync).mockRejectedValue(noBrowserError)
    vi.mocked(openURL).mockResolvedValue(null)

    await openUri({ uri, isSafeUri: true, throwOnError: true })

    expect(openURL).toHaveBeenCalledWith(uri)
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs and rethrows when the fallback also fails', async () => {
    const fallbackError = new Error('No Activity found to handle Intent')
    vi.mocked(WebBrowser.openBrowserAsync).mockRejectedValue(noBrowserError)
    vi.mocked(openURL).mockRejectedValue(fallbackError)

    await expect(openUri({ uri, isSafeUri: true, throwOnError: true })).rejects.toBe(fallbackError)
    expect(logger.error).toHaveBeenCalledWith(fallbackError, expect.objectContaining({ extra: { uri } }))
  })

  it('logs without throwing when the fallback fails and throwOnError is off', async () => {
    vi.mocked(WebBrowser.openBrowserAsync).mockRejectedValue(noBrowserError)
    vi.mocked(openURL).mockRejectedValue(new Error('No Activity found to handle Intent'))

    await expect(openUri({ uri, isSafeUri: true })).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('does not use the in-app browser or retry when opening externally', async () => {
    const externalError = new Error('No Activity found to handle Intent')
    vi.mocked(openURL).mockRejectedValue(externalError)

    await expect(openUri({ uri, isSafeUri: true, openExternalBrowser: true, throwOnError: true })).rejects.toBe(
      externalError,
    )
    expect(WebBrowser.openBrowserAsync).not.toHaveBeenCalled()
    expect(openURL).toHaveBeenCalledTimes(1)
  })

  it('does not fall back for other in-app browser errors', async () => {
    const otherError = new Error('Another WebBrowser is already being presented')
    vi.mocked(WebBrowser.openBrowserAsync).mockRejectedValue(otherError)

    await expect(openUri({ uri, isSafeUri: true, throwOnError: true })).rejects.toBe(otherError)
    expect(openURL).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledWith(otherError, expect.any(Object))
  })
})
