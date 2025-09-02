import { useCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useCurrencies'
import {
  DAI_POLYGON,
  USDC_POLYGON,
  USDC_SEPOLIA,
  USDT_POLYGON,
  WBTC_POLYGON,
  WETH_POLYGON,
} from 'uniswap/src/constants/tokens'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'

// Mainnet tokens (Polygon)
const mainnetBaseCurrencyIds = [
  buildNativeCurrencyId(UniverseChainId.Polygon),
  buildWrappedNativeCurrencyId(UniverseChainId.Polygon),
  currencyId(USDC_POLYGON),
  currencyId(USDT_POLYGON),
  currencyId(DAI_POLYGON),
  currencyId(WBTC_POLYGON),
  currencyId(WETH_POLYGON),
]

// Testnet tokens (Sepolia)
const testnetBaseCurrencyIds = [
  buildNativeCurrencyId(UniverseChainId.Sepolia),
  buildWrappedNativeCurrencyId(UniverseChainId.Sepolia),
  currencyId(USDC_SEPOLIA),
]

export function useAllCommonBaseCurrencies(): GqlResult<CurrencyInfo[]> {
  const { isTestnetModeEnabled } = useEnabledChains()
  return useCurrencies(isTestnetModeEnabled ? testnetBaseCurrencyIds : mainnetBaseCurrencyIds)
}
