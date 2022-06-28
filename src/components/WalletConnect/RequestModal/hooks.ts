import { CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { ChainId } from 'src/constants/chains'
import { useNativeCurrencyBalance } from 'src/features/balances/hooks'
import { FeeInfo } from 'src/features/gas/types'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'

export function useHasSufficientFunds({
  account,
  chainId,
  gasFeeInfo,
  value,
}: {
  account: string | undefined
  chainId: ChainId | undefined
  gasFeeInfo: FeeInfo | undefined
  value: string | undefined
}) {
  const nativeCurrency = NativeCurrency.onChain(chainId || ChainId.Mainnet)
  const nativeBalance = useNativeCurrencyBalance(chainId || ChainId.Mainnet, account)

  const hasSufficientFunds = useMemo(() => {
    if (!gasFeeInfo || !chainId) return true

    const gasFeeAmount = gasFeeInfo
      ? CurrencyAmount.fromRawAmount(nativeCurrency, gasFeeInfo.fee.urgent)
      : undefined
    const transactionAmount = value
      ? CurrencyAmount.fromRawAmount(nativeCurrency, value)
      : undefined

    let totalTransactionCost
    if (gasFeeAmount && transactionAmount) {
      totalTransactionCost = gasFeeAmount.add(transactionAmount)
    } else if (gasFeeAmount) {
      totalTransactionCost = gasFeeAmount
    } else if (transactionAmount) {
      totalTransactionCost = transactionAmount
    }

    if (!totalTransactionCost) return true
    return nativeBalance.balance.greaterThan(totalTransactionCost)
  }, [chainId, value, gasFeeInfo, nativeCurrency, nativeBalance])

  return hasSufficientFunds
}
