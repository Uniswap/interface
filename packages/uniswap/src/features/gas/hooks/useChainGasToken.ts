import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { nativeOnChain, PATHUSD_TEMPO } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'

/**
 * Returns the gas token for a given chain (pure function, no hooks).
 *
 * On Tempo, gas is paid in pathUSD. On all other chains, gas is paid in the native currency.
 */
export function getChainGasToken(chainId: UniverseChainId): Currency {
  return chainId === UniverseChainId.Tempo ? PATHUSD_TEMPO : nativeOnChain(chainId)
}

/**
 * Returns the gas token and its on-chain balance for a given chain.
 *
 * On Tempo, gas is paid in pathUSD (not a native token). This hook abstracts
 * that difference so consumers don't need chain-specific gas logic.
 */
export function useChainGasToken({ chainId, accountAddress }: { chainId: UniverseChainId; accountAddress?: Address }): {
  gasToken: Currency
  gasBalance: CurrencyAmount<Currency> | undefined
  isLoading: boolean
} {
  const gasToken = getChainGasToken(chainId)

  const { balance: gasBalance, isLoading } = useOnChainCurrencyBalance(
    accountAddress ? gasToken : undefined,
    accountAddress,
  )

  return { gasToken, gasBalance, isLoading }
}
