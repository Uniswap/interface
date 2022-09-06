import { CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useNativeCurrencyBalance } from 'src/features/balances/hooks'
import { TransactionGasFeeInfo } from 'src/features/gas/types'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
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
}) {
  const nativeCurrency = NativeCurrency.onChain(chainId || ChainId.Mainnet)
  const nativeBalance = useNativeCurrencyBalance(chainId || ChainId.Mainnet, account)

  const hasSufficientFunds = useMemo(() => {
    const transactionAmount = value
      ? CurrencyAmount.fromRawAmount(nativeCurrency, value)
      : undefined

    return hasSufficientFundsIncludingGas({
      transactionAmount,
      gasFee: gasFeeInfo?.gasFee,
      nativeCurrencyBalance: nativeBalance.balance,
    })
  }, [value, gasFeeInfo, nativeCurrency, nativeBalance])

  return hasSufficientFunds
}
