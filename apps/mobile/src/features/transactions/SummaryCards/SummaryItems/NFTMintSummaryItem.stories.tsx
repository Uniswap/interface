import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { NFTMintSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTMintSummaryItem'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import {
  ClassicTransactionDetails,
  NFTMintTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

const meta: Meta<typeof NFTMintSummaryItem> = {
  title: 'WIP/Activity Items',
}

export default meta

const baseNFTMintTx: Omit<ClassicTransactionDetails, 'status'> & {
  typeInfo: NFTMintTransactionInfo
} = {
  routing: Routing.CLASSIC,
  from: '',
  addedTime: Date.now() - 30000,
  hash: '',
  options: { request: {} },
  chainId: 1,
  id: '',
  typeInfo: {
    type: TransactionType.NFTMint,
    nftSummaryInfo: {
      collectionName: 'Froggy Friends Official',
      imageURL:
        'https://lh3.googleusercontent.com/9LokgAuB0Xqkio273GE0pY0WSJwOExFtFI1SkJT2jK-USvqFc-5if7ZP5PQ1h8s5YPimyJG5cSOdGGR2UaD3gTYMKAhj6yikYaw=s250',
      name: 'Froggy Friend #1777',
      tokenId: '1777',
      address: '0x7ad05c1b87e93be306a9eadf80ea60d7648f1b6f',
    },
  },
}

export const NFTMint: StoryObj = {
  render: () => (
    <>
      <NFTMintSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTMintTx,
          status: TransactionStatus.Pending,
        }}
      />
      <NFTMintSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTMintTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <NFTMintSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTMintTx,
          status: TransactionStatus.Canceled,
        }}
      />
      <NFTMintSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTMintTx,
          status: TransactionStatus.Failed,
        }}
      />
      <NFTMintSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTMintTx,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
