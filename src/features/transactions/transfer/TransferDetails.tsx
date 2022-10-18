import React from 'react'
import { ChainId } from 'src/constants/chains'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'

export function TransferDetails({ chainId, gasFee }: { chainId: ChainId; gasFee?: string }) {
  return <TransactionDetails chainId={chainId} gasFee={gasFee} />
}
