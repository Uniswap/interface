import React from 'react'
import { ChainId } from 'src/constants/chains'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'

export function TransferDetails({
  chainId,
  gasFee,
}: {
  chainId: ChainId | undefined
  gasFee: string | undefined
}) {
  return <TransactionDetails chainId={chainId} gasFee={gasFee} />
}
