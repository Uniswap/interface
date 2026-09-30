import type { UseQueryResult } from '@tanstack/react-query'
import { UniverseChainId } from '@universe/chains'
import { USDC, USDT, WBTC } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useMultichainCurrencyInfosWithoutBridgedNatives } from 'uniswap/src/features/tokens/useMultichainCurrencyInfos'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyIdWithThrow, currencyId } from 'uniswap/src/utils/currencyId'

// Use Mainnet base token addresses since the multichain lookup returns each token
// on each network
const baseCurrencyIds = [
  buildNativeCurrencyId(UniverseChainId.Mainnet),
  buildNativeCurrencyId(UniverseChainId.Polygon),
  buildNativeCurrencyId(UniverseChainId.Bnb),
  buildNativeCurrencyId(UniverseChainId.Celo),
  buildNativeCurrencyId(UniverseChainId.Avalanche),
  buildNativeCurrencyId(UniverseChainId.Solana),
  buildNativeCurrencyId(UniverseChainId.Monad),
  currencyId(USDC),
  currencyId(USDT),
  currencyId(WBTC),
  buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
]

export function useAllCommonBaseCurrencies(): UseQueryResult<CurrencyInfo[]> {
  const { isTestnetModeEnabled } = useEnabledChains()
  return useMultichainCurrencyInfosWithoutBridgedNatives(isTestnetModeEnabled ? [] : baseCurrencyIds)
}
