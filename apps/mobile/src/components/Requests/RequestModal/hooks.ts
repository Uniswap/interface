import { useMemo } from 'react'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useOnChainNativeCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { hasSufficientFundsIncludingGas } from 'wallet/src/features/transactions/utils'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export function useHasSufficientFunds({
  account,
  chainId,
  gasFee,
  value,
}: {
  account?: string
  chainId?: WalletChainId
  gasFee: GasFeeResult
  value?: string
}): boolean {
  const nativeCurrency = NativeCurrency.onChain(chainId || UniverseChainId.Mainnet)
  const { balance: nativeBalance } = useOnChainNativeCurrencyBalance(chainId ?? UniverseChainId.Mainnet, account)

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
