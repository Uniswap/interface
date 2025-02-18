import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'

export function useHasSufficientFunds({
  account,
  chainId,
  gasFee,
  value,
}: {
  account?: string
  chainId?: UniverseChainId
  gasFee: GasFeeResult
  value?: string
}): boolean {
  const { defaultChainId } = useEnabledChains()
  const nativeCurrency = NativeCurrency.onChain(chainId || defaultChainId)
  const { balance: nativeBalance } = useOnChainNativeCurrencyBalance(chainId ?? defaultChainId, account)

  const hasSufficientFunds = useMemo(() => {
    const transactionAmount =
      getCurrencyAmount({
        value,
        valueType: ValueType.Raw,
        currency: nativeCurrency,
      }) ?? undefined

    return hasSufficientFundsIncludingGas({
      transactionAmount,
      gasFee: gasFee.value,
      nativeCurrencyBalance: nativeBalance,
    })
  }, [value, nativeCurrency, gasFee.value, nativeBalance])

  return hasSufficientFunds
}
