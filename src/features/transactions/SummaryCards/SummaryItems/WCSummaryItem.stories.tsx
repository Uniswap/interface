import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChainId } from 'src/constants/chains'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  WCConfirmInfo,
} from 'src/features/transactions/types'
import WCSummaryItem from './WCSummaryItem'

const meta: Meta<typeof WCSummaryItem> = {
  title: 'WIP/Activity Items',
}

export default meta

const baseUnknownItem: Omit<TransactionDetails, 'status'> & { typeInfo: WCConfirmInfo } = {
  from: '0x76e4de46c21603545eaaf7daf25e54c0d06bafa9',
  addedTime: Date.now() - 30000,
  hash: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  id: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  options: { request: {} },
  chainId: 1,
  typeInfo: {
    type: TransactionType.WCConfirm,
    chainId: 1,
    dapp: {
      chain_id: 1,
      icon: 'https://synapseprotocol.com/favicon.ico',
      name: 'Synapse',
      url: 'https://synapseprotocol.com',
      version: '1',
    },
  },
}

export const WalletConnect: StoryObj = {
  render: () => (
    <>
      <WCSummaryItem
        transaction={{
          ...baseUnknownItem,
          status: TransactionStatus.Pending,
        }}
      />
      <WCSummaryItem
        transaction={{
          ...baseUnknownItem,
          status: TransactionStatus.Failed,
        }}
      />
      <WCSummaryItem
        transaction={{
          ...baseUnknownItem,
          status: TransactionStatus.Success,
        }}
      />
      <WCSummaryItem
        transaction={{
          ...baseUnknownItem,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
