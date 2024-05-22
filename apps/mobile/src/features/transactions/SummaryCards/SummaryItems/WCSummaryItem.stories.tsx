import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { WCSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/WCSummaryItem'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  WCConfirmInfo,
} from 'wallet/src/features/transactions/types'

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
    dapp: {
      icon: 'https://synapseprotocol.com/favicon.ico',
      name: 'Synapse',
      url: 'https://synapseprotocol.com',
      source: 'walletconnect',
    },
  },
}

export const WalletConnect: StoryObj = {
  render: () => (
    <>
      <WCSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownItem,
          status: TransactionStatus.Pending,
        }}
      />
      <WCSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownItem,
          status: TransactionStatus.Failed,
        }}
      />
      <WCSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownItem,
          status: TransactionStatus.Success,
        }}
      />
      <WCSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnknownItem,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
