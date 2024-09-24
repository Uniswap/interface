import { useMemo } from 'react'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'

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
