import { useMemo } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useOnChainNativeCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { hasSufficientFundsIncludingGas } from 'wallet/src/features/transactions/utils'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function useHasSufficientFunds({
  account,
  chainId,
  gasFee,
  value,
}: {
  account?: string
  chainId?: ChainId
  gasFee: GasFeeResult
  value?: string
}): boolean {
  const nativeCurrency = NativeCurrency.onChain(chainId || ChainId.Mainnet)
  const { balance: nativeBalance } = useOnChainNativeCurrencyBalance(
    chainId ?? ChainId.Mainnet,
    account
  )

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
