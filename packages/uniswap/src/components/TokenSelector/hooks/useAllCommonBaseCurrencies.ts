import { useCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useCurrencies'
import {
  USDC,
  USDC_ARBITRUM,
  USDC_BASE,
  USDC_SEPOLIA,
  USDC_UNICHAIN,
  USDC_XLAYER_MAINNET,
  USDM_MEGAETH_MAINNET,
  USDT,
  WBTC,
} from 'uniswap/src/constants/tokens'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'

// Use Mainnet base token addresses since TokenProjects query returns each token
// on each network. Include Unichain, Base, Arbitrum native + WETH so common tokens are never empty on those chains.
const baseCurrencyIds = [
  buildNativeCurrencyId(UniverseChainId.Mainnet),
  buildNativeCurrencyId(UniverseChainId.Polygon),
  buildNativeCurrencyId(UniverseChainId.Bnb),
  buildNativeCurrencyId(UniverseChainId.HyperMainnet),
  buildNativeCurrencyId(UniverseChainId.Celo),
  buildNativeCurrencyId(UniverseChainId.Avalanche),
  buildNativeCurrencyId(UniverseChainId.XLayer),
  buildNativeCurrencyId(UniverseChainId.MEGAETHMainnet),
  buildNativeCurrencyId(UniverseChainId.Unichain),
  buildNativeCurrencyId(UniverseChainId.Base),
  buildNativeCurrencyId(UniverseChainId.ArbitrumOne),
  currencyId(USDC),
  currencyId(USDC_XLAYER_MAINNET),
  currencyId(USDM_MEGAETH_MAINNET),
  currencyId(USDC_UNICHAIN),
  currencyId(USDC_BASE),
  currencyId(USDC_ARBITRUM),
  currencyId(USDT),
  currencyId(WBTC),
  buildWrappedNativeCurrencyId(UniverseChainId.Mainnet),
  buildWrappedNativeCurrencyId(UniverseChainId.Unichain),
  buildWrappedNativeCurrencyId(UniverseChainId.Base),
  buildWrappedNativeCurrencyId(UniverseChainId.ArbitrumOne),
]

const baseTestnetCurrencyIds = [
  buildNativeCurrencyId(UniverseChainId.Sepolia),
  currencyId(USDC_SEPOLIA),
  buildWrappedNativeCurrencyId(UniverseChainId.Sepolia),
]

export function useAllCommonBaseCurrencies(): GqlResult<CurrencyInfo[]> {
  const { isTestnetModeEnabled } = useEnabledChains()
  return useCurrencies(isTestnetModeEnabled ? baseTestnetCurrencyIds : baseCurrencyIds)
}
