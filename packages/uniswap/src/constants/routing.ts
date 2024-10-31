import { Currency, Token, WETH9 } from '@uniswap/sdk-core'
// eslint-disable-next-line no-restricted-imports
import type { ImageSourcePropType } from 'react-native'
import { CELO_LOGO, ETH_LOGO } from 'ui/src/assets'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import {
  ARB,
  BTC_BSC,
  BUSD_BSC,
  CEUR_CELO,
  CUSD_CELO,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_AVALANCHE,
  DAI_BSC,
  DAI_OPTIMISM,
  DAI_POLYGON,
  ETH_BSC,
  OP,
  PORTAL_ETH_CELO,
  UNI,
  USDC_ARBITRUM,
  USDC_ASTROCHAIN_SEPOLIA,
  USDC_AVALANCHE,
  USDC_BASE,
  USDC_BSC,
  USDC_CELO,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDC_SEPOLIA,
  USDC_WORLD_CHAIN,
  USDC_ZKSYNC,
  USDC_ZORA,
  USDT,
  USDT_ARBITRUM_ONE,
  USDT_AVALANCHE,
  USDT_BSC,
  USDT_OPTIMISM,
  USDT_POLYGON,
  WBTC,
  WBTC_ARBITRUM_ONE,
  WBTC_CELO,
  WBTC_OPTIMISM,
  WBTC_POLYGON,
  WETH_AVALANCHE,
  WETH_POLYGON,
  WRAPPED_NATIVE_CURRENCY,
  isCelo,
  nativeOnChain,
} from 'uniswap/src/constants/tokens'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isSameAddress } from 'utilities/src/addresses'

type ChainCurrencyList = {
  readonly [chainId: number]: CurrencyInfo[]
}

/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [UniverseChainId.Mainnet]: [
    nativeOnChain(UniverseChainId.Mainnet),
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet] as Token,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Sepolia]: [
    nativeOnChain(UniverseChainId.Sepolia),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Sepolia] as Token,
    USDC_SEPOLIA,
    UNI[UniverseChainId.Sepolia],
  ].map(buildCurrencyInfo),

  [UniverseChainId.ArbitrumOne]: [
    nativeOnChain(UniverseChainId.ArbitrumOne),
    ARB,
    DAI_ARBITRUM_ONE,
    USDC_ARBITRUM,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.ArbitrumOne] as Token,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Optimism]: [
    nativeOnChain(UniverseChainId.Optimism),
    OP,
    DAI_OPTIMISM,
    USDC_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
    WETH9[UniverseChainId.Optimism] as Token,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Base]: [
    nativeOnChain(UniverseChainId.Base),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Base] as Token,
    USDC_BASE,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Blast]: [
    nativeOnChain(UniverseChainId.Blast),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Blast] as Token,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Polygon]: [
    nativeOnChain(UniverseChainId.Polygon),
    WETH_POLYGON,
    USDC_POLYGON,
    DAI_POLYGON,
    USDT_POLYGON,
    WBTC_POLYGON,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Celo]: [
    nativeOnChain(UniverseChainId.Celo),
    CEUR_CELO,
    CUSD_CELO,
    PORTAL_ETH_CELO,
    USDC_CELO,
    WBTC_CELO,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Bnb]: [
    nativeOnChain(UniverseChainId.Bnb),
    DAI_BSC,
    USDC_BSC,
    USDT_BSC,
    ETH_BSC,
    BTC_BSC,
    BUSD_BSC,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Avalanche]: [
    nativeOnChain(UniverseChainId.Avalanche),
    DAI_AVALANCHE,
    USDC_AVALANCHE,
    USDT_AVALANCHE,
    WETH_AVALANCHE,
  ].map(buildCurrencyInfo),

  [UniverseChainId.WorldChain]: [
    nativeOnChain(UniverseChainId.WorldChain),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.WorldChain] as Token,
    USDC_WORLD_CHAIN,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Zora]: [
    nativeOnChain(UniverseChainId.Zora),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Zora] as Token,
    USDC_ZORA,
  ].map(buildCurrencyInfo),

  [UniverseChainId.Zksync]: [
    nativeOnChain(UniverseChainId.Zksync),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.Zksync] as Token,
    USDC_ZKSYNC,
  ].map(buildCurrencyInfo),

  [UniverseChainId.AstrochainSepolia]: [
    nativeOnChain(UniverseChainId.AstrochainSepolia),
    WRAPPED_NATIVE_CURRENCY[UniverseChainId.AstrochainSepolia] as Token,
    USDC_ASTROCHAIN_SEPOLIA,
  ].map(buildCurrencyInfo),
}

function getNativeLogoURI(chainId: UniverseChainId = UniverseChainId.Mainnet): ImageSourcePropType {
  if (chainId === UniverseChainId.Mainnet) {
    return ETH_LOGO as ImageSourcePropType
  }

  return UNIVERSE_CHAIN_INFO[chainId].nativeCurrency.logo ?? (ETH_LOGO as ImageSourcePropType)
}

function getTokenLogoURI(chainId: UniverseChainId, address: string): ImageSourcePropType | string | undefined {
  const chainInfo = UNIVERSE_CHAIN_INFO[chainId]
  const networkName = chainInfo?.assetRepoNetworkName

  if (isCelo(chainId) && isSameAddress(address, nativeOnChain(chainId).wrapped.address)) {
    return CELO_LOGO as ImageSourcePropType
  }
  if (isCelo(chainId) && isSameAddress(address, PORTAL_ETH_CELO.address)) {
    return ETH_LOGO as ImageSourcePropType
  }

  return networkName
    ? `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${address}/logo.png`
    : undefined
}

export function buildCurrencyInfo(commonBase: Currency): CurrencyInfo {
  const logoUrl = commonBase.isNative
    ? getNativeLogoURI(commonBase.chainId)
    : getTokenLogoURI(commonBase.chainId, commonBase.address)

  return {
    currency: commonBase,
    logoUrl,
    safetyLevel: SafetyLevel.Verified,
    isSpam: false,
  } as CurrencyInfo
}
