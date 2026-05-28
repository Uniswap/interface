import { GasFeeResult } from '@universe/api'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { hasSufficientGasBalance } from 'uniswap/src/features/gas/utils'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'

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
  const effectiveChainId = chainId ?? defaultChainId
  const { gasToken, gasBalance } = useChainGasToken({ chainId: effectiveChainId, accountAddress: account })

  const hasSufficientFunds = useMemo(() => {
    // The `value` represents the transaction's native value field. On standard chains this
    // is the native currency; on Tempo this maps to pathUSD (the gas token). We always
    // include it as gasTokenTransactionAmount so the sufficiency check accounts for both
    // the send amount and the gas fee drawing from the same balance.
    const transactionAmount =
      getCurrencyAmount({
        value,
        valueType: ValueType.Raw,
        currency: gasToken,
      }) ?? undefined

    return hasSufficientGasBalance({
      chainId: effectiveChainId,
      gasBalance,
      gasFee: gasFee.value,
      gasTokenTransactionAmount: transactionAmount,
    })
  }, [value, gasToken, gasFee.value, gasBalance, effectiveChainId])

  return hasSufficientFunds
}
