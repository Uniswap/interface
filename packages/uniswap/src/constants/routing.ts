import { Currency, Token, WETH9 } from '@uniswap/sdk-core'
import type { ImageSourcePropType } from 'react-native'
import { CELO_LOGO, ETH_LOGO } from 'ui/src/assets'
import {
  ARB,
  BUSD_BSC,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_AVALANCHE,
  DAI_BSC,
  DAI_OPTIMISM,
  DAI_POLYGON,
  ETH_BSC,
  OP,
  PORTAL_ETH_CELO,
  NXT,
  USDC_ARBITRUM,
  USDC_AVALANCHE,
  USDC_BASE,
  USDC_BSC,
  USDC_CELO,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDC_SEPOLIA,
  USDC_SONEIUM,
  USDC_UNICHAIN,
  USDC_WORLD_CHAIN,
  USDC_ZKSYNC,
  USDC_ZORA,
  USDT,
  USDT_ARBITRUM_ONE,
  USDT_AVALANCHE,
  USDT_BSC,
  USDT_MONAD_TESTNET,
  USDT_OPTIMISM,
  USDT_POLYGON,
  WBTC,
  WBTC_ARBITRUM_ONE,
  WBTC_OPTIMISM,
  WBTC_POLYGON,
  WETH_AVALANCHE,
  WETH_POLYGON,
  WRAPPED_NATIVE_CURRENCY,
  isCelo,
  nativeOnChain,
} from 'nexttrade/src/constants/tokens'
import { ProtectionResult } from 'nexttrade/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'nexttrade/src/features/chains/chainInfo'
import { UniverseChainId } from 'nexttrade/src/features/chains/types'
import { CurrencyInfo, TokenList } from 'nexttrade/src/features/dataApi/types'
import { buildCurrencyInfo } from 'nexttrade/src/features/dataApi/utils'
import { isSameAddress } from 'utilities/src/addresses'

type ChainCurrencyList = {
  readonly [chainId: number]: CurrencyInfo[]
}

/**
 * @deprecated
 * Instead, see the list used in the token selector's quick-select common options section at useAllCommonBaseCurrencies.ts.
 * This list is currently used as fallback list when Token GQL query fails for above list + for hardcoded tokens on testnet chains.
 */
export const COMMON_BASES: ChainCurrencyList = {
  [UniverseChainId.Mainnet]: [
    nativeOnChain(UniverseChainId.Mainnet),
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet] as Token,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.ArbitrumOne]: [
    nativeOnChain(UniverseChainId.ArbitrumOne),
    ARB,
    DAI_ARBITRUM_ONE,
    USDC_ARBITRUM,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.ArbitrumOne] as Token,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Avalanche]: [
    nativeOnChain(UniverseChainId.Avalanche),
    DAI_AVALANCHE,
    USDC_AVALANCHE,
    USDT_AVALANCHE,
    WETH_AVALANCHE,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Base]: [
    nativeOnChain(UniverseChainId.Base),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Base] as Token,
    USDC_BASE,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Blast]: [
    nativeOnChain(UniverseChainId.Blast),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Blast] as Token,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Bnb]: [nativeOnChain(UniverseChainId.Bnb), DAI_BSC, USDC_BSC, USDT_BSC, ETH_BSC, BUSD_BSC].map(
    buildPartialCurrencyInfo,
  ),

  [UniverseChainId.Celo]: [nativeOnChain(UniverseChainId.Celo), USDC_CELO].map(buildPartialCurrencyInfo),

  [UniverseChainId.MonadTestnet]: [
    nativeOnChain(UniverseChainId.MonadTestnet),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.MonadTestnet] as Token,
    USDT_MONAD_TESTNET,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Optimism]: [
    nativeOnChain(UniverseChainId.Optimism),
    OP,
    DAI_OPTIMISM,
    USDC_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
    WETH9[UniverseChainId.Optimism] as Token,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Polygon]: [
    nativeOnChain(UniverseChainId.Polygon),
    WETH_POLYGON,
    USDC_POLYGON,
    DAI_POLYGON,
    USDT_POLYGON,
    WBTC_POLYGON,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Sepolia]: [
    nativeOnChain(UniverseChainId.Sepolia),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Sepolia] as Token,
    USDC_SEPOLIA,
    NXT[UniverseChainId.Sepolia],
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Soneium]: [
    nativeOnChain(UniverseChainId.Soneium),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Soneium] as Token,
    USDC_SONEIUM,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Unichain]: [
    nativeOnChain(UniverseChainId.Unichain),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Unichain] as Token,
    USDC_UNICHAIN,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.UnichainSepolia]: [
    nativeOnChain(UniverseChainId.UnichainSepolia),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.UnichainSepolia] as Token,
    // TODO(WEB-5160): re-add usdc sepolia
    // USDC_UNICHAIN_SEPOLIA,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.WorldChain]: [
    nativeOnChain(UniverseChainId.WorldChain),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.WorldChain] as Token,
    USDC_WORLD_CHAIN,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Zksync]: [
    nativeOnChain(UniverseChainId.Zksync),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Zksync] as Token,
    USDC_ZKSYNC,
  ].map(buildPartialCurrencyInfo),

  [UniverseChainId.Zora]: [
    nativeOnChain(UniverseChainId.Zora),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Zora] as Token,
    USDC_ZORA,
  ].map(buildPartialCurrencyInfo),
}

export function getCommonBase(chainId?: number, isNative?: boolean, address?: string): CurrencyInfo | undefined {
  if (!address || !chainId) {
    return undefined
  }
  return COMMON_BASES[chainId]?.find(
    (base) =>
      (base.currency.isNative && isNative) || (base.currency.isToken && isSameAddress(base.currency.address, address)),
  )
}

function getNativeLogoURI(chainId: UniverseChainId = UniverseChainId.Mainnet): ImageSourcePropType {
  if (chainId === UniverseChainId.Mainnet) {
    return ETH_LOGO as ImageSourcePropType
  }

  return getChainInfo(chainId).nativeCurrency.logo ?? (ETH_LOGO as ImageSourcePropType)
}

function getTokenLogoURI(chainId: UniverseChainId, address: string): ImageSourcePropType | string | undefined {
  const chainInfo = getChainInfo(chainId)
  const networkName = chainInfo?.assetRepoNetworkName

  if (isCelo(chainId) && isSameAddress(address, nativeOnChain(chainId).wrapped.address)) {
    return CELO_LOGO as ImageSourcePropType
  }
  if (isCelo(chainId) && isSameAddress(address, PORTAL_ETH_CELO.address)) {
    return ETH_LOGO as ImageSourcePropType
  }

  return networkName
    ? `https://raw.githubusercontent.com/NextTrade/assets/master/blockchains/${networkName}/assets/${address}/logo.png`
    : undefined
}

export function buildPartialCurrencyInfo(commonBase: Currency): CurrencyInfo {
  const logoUrl = commonBase.isNative
    ? getNativeLogoURI(commonBase.chainId)
    : getTokenLogoURI(commonBase.chainId, commonBase.address)

  return buildCurrencyInfo({
    currency: commonBase,
    logoUrl,
    safetyInfo: {
      tokenList: TokenList.Default,
      protectionResult: ProtectionResult.Benign,
    },
    isSpam: false,
  } as CurrencyInfo)
}
