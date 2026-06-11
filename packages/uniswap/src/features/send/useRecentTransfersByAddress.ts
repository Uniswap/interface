import { TransactionTypeFilter } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { useMemo } from 'react'
import { isSendTokenTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { AddressStringFormat, ensureLeading0x, normalizeAddress } from 'uniswap/src/utils/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'

export type TransferCount = {
  address: string
  count: number
}

export function useRecentTransfersByAddress(evmAddress?: string): {
  transfers: TransferCount[]
  loading: boolean
} {
  const { data: transactions, loading } = useListTransactions({
    evmAddress,
    filterTransactionTypes: [TransactionTypeFilter.SEND],
    hideSpamTokens: true,
  })

  const transfers = useMemo(() => {
    const counts = new Map<string, number>()
    const orderedAddresses: string[] = []

    transactions?.forEach((transaction) => {
      if (!isSendTokenTransactionInfo(transaction.typeInfo)) {
        return
      }

      const recipient = transaction.typeInfo.recipient
      const key = sanitizeRecipient(recipient)
      counts.set(key, (counts.get(key) ?? 0) + 1)
      if (!orderedAddresses.includes(key)) {
        orderedAddresses.push(key)
      }
    })

    return orderedAddresses.map((key) => ({
      address: key,
      count: counts.get(key) ?? 0,
    }))
  }, [transactions])

  return {
    transfers,
    loading,
  }
}

function sanitizeRecipient(recipient: string): string {
  const trimmed = recipient.trim()
  const with0x = ensureLeading0x(trimmed)
  if (isEVMAddress(with0x)) {
    return normalizeAddress(with0x, AddressStringFormat.Lowercase)
  }
  return trimmed
}
