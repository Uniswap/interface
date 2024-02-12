import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { NFTApproveSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTApproveSummaryItem'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import {
  NFTApproveTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

const meta: Meta<typeof NFTApproveSummaryItem> = {
  title: 'WIP/Activity Items',
}

export default meta

const baseApproveTx: Omit<TransactionDetails, 'status'> & {
  typeInfo: NFTApproveTransactionInfo
} = {
  from: '',
  addedTime: Date.now() - 30000,
  hash: '',
  options: { request: {} },
  chainId: 1,
  id: '',
  typeInfo: {
    type: TransactionType.NFTApprove,
    spender: '',
    nftSummaryInfo: {
      collectionName: 'Froggy Friends Official',
      imageURL:
        'https://lh3.googleusercontent.com/9LokgAuB0Xqkio273GE0pY0WSJwOExFtFI1SkJT2jK-USvqFc-5if7ZP5PQ1h8s5YPimyJG5cSOdGGR2UaD3gTYMKAhj6yikYaw=s250',
      name: 'Froggy Friend #1777',
      tokenId: '1777',
    },
  },
}

export const NFTApprove: StoryObj = {
  render: () => (
    <>
      <NFTApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveTx,
          status: TransactionStatus.Pending,
        }}
      />
      <NFTApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveTx,
          status: TransactionStatus.Failed,
        }}
      />
      <NFTApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveTx,
          status: TransactionStatus.Success,
        }}
      />
      <NFTApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveTx,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
