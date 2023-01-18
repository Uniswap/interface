import { CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useOnChainNativeCurrencyBalance } from 'src/features/balances/api'
import { TransactionGasFeeInfo } from 'src/features/gas/types'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'
import { hasSufficientFundsIncludingGas } from 'src/features/transactions/utils'

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
