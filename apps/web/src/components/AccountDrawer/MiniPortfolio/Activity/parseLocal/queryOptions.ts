import { queryOptions } from '@tanstack/react-query'
import type { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import type { InterfaceTransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import {
  forTransactionToActivity,
  transactionToActivity,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactionToActivity'
import type {
  FormatNumberFunctionType,
  FormatFiatPriceFunctionType,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'

export function getTransactionToActivityQueryOptions({
  transaction,
  formatNumber,
  isEarnActivityDisplayEnabled = true,
}: {
  transaction?: InterfaceTransactionDetails
  formatNumber: FormatNumberFunctionType
  isEarnActivityDisplayEnabled?: boolean
}) {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.TransactionToActivity, transaction, isEarnActivityDisplayEnabled],
    queryFn: async () =>
      transactionToActivity({
        details: transaction,
        formatNumber,
        isEarnActivityDisplayEnabled,
      }),
  })
}

export function getFORTransactionToActivityQueryOptions({
  transaction,
  formatNumber,
  formatFiatPrice,
}: {
  transaction?: FORTransaction
  formatNumber: FormatNumberFunctionType
  formatFiatPrice: FormatFiatPriceFunctionType
}) {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.TransactionToActivity, transaction],
    queryFn: async () => forTransactionToActivity({ transaction, formatNumber, formatFiatPrice }),
  })
}
