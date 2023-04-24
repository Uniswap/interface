import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChainId } from 'src/constants/chains'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  UnknownTransactionInfo,
} from 'src/features/transactions/types'
import UnknownSummaryItem from './UnknownSummaryItem'

const meta: Meta<typeof UnknownSummaryItem> = {
  title: 'WIP/Activity Items',
}

export default meta

const baseUnknownTx: Omit<TransactionDetails, 'status'> & { typeInfo: UnknownTransactionInfo } = {
  from: '0x76e4de46c21603545eaaf7daf25e54c0d06bafa9',
  addedTime: Date.now() - 30000,
  hash: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  id: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  options: { request: {} },
  chainId: 1,
  typeInfo: {
    type: TransactionType.Unknown,
  },
}

export const Unknown: StoryObj = {
  render: () => (
    <>
      <UnknownSummaryItem
        transaction={{
          ...baseUnknownTx,
          status: TransactionStatus.Pending,
        }}
      />
      <UnknownSummaryItem
        transaction={{
          ...baseUnknownTx,
          status: TransactionStatus.Failed,
        }}
      />
      <UnknownSummaryItem
        transaction={{
          ...baseUnknownTx,
          status: TransactionStatus.Success,
        }}
      />
      <UnknownSummaryItem
        transaction={{
          ...baseUnknownTx,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
