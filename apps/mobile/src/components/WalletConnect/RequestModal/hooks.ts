import { CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { hasSufficientFundsIncludingGas } from 'src/features/transactions/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { TransactionGasFeeInfo } from 'wallet/src/features/gas/types'
import { useOnChainNativeCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'

export function useHasSufficientFunds({
  account,
  chainId,
  gasFeeInfo,
  value,
}: {
  account?: string
  chainId?: ChainId
  gasFeeInfo?: TransactionGasFeeInfo
  value?: string
}): boolean {
  const nativeCurrency = NativeCurrency.onChain(chainId || ChainId.Mainnet)
  const { balance: nativeBalance } = useOnChainNativeCurrencyBalance(
    chainId ?? ChainId.Mainnet,
    account
  )

  const hasSufficientFunds = useMemo(() => {
    const transactionAmount = value
      ? CurrencyAmount.fromRawAmount(nativeCurrency, value)
      : undefined

    return hasSufficientFundsIncludingGas({
      transactionAmount,
      gasFee: gasFeeInfo?.gasFee,
      nativeCurrencyBalance: nativeBalance,
    })
  }, [value, gasFeeInfo, nativeCurrency, nativeBalance])

  return hasSufficientFunds
}
