import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { Chain, TokenDocument } from 'src/data/__generated__/types-and-hooks'
import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import FiatPurchaseSummaryItem from './FiatPurchaseSummaryItem'

const meta: Meta<typeof FiatPurchaseSummaryItem> = {
  title: 'WIP/Activity Items',
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: TokenDocument,
            variables: {
              chain: 'ETHEREUM',
              address: null,
            },
          },
          result: {
            data: {
              token: {
                __typename: 'Token',
                address: null,
                chain: 'ETHEREUM',
                decimals: 18,
                id: 'VG9rZW46RVRIRVJFVU1fbnVsbA==',
                name: 'Ethereum',
                project: {
                  __typename: 'TokenProject',
                  id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNX251bGw=',
                  isSpam: false,
                  logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
                  safetyLevel: 'VERIFIED',
                },
                symbol: 'ETH',
              },
            },
          },
        },
      ],
    },
  },
}

export default meta

const baseFaitPurchaseTx: Omit<TransactionDetails, 'status'> & {
  typeInfo: FiatPurchaseTransactionInfo
} = {
  from: '0x76e4de46c21603545eaaf7daf25e54c0d06bafa9',
  addedTime: Date.now() - 30000,
  hash: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  id: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  options: { request: {} },
  chainId: 1,
  typeInfo: {
    type: TransactionType.FiatPurchase,
    inputCurrency: {
      type: 'fiat',
      code: 'USD',
    },
    inputCurrencyAmount: 123,
    outputCurrency: {
      type: 'crypto',
      metadata: {
        contractAddress: NATIVE_ADDRESS,
        chainId: Chain.Ethereum,
      },
    },
    outputCurrencyAmount: 123,
    syncedWithBackend: false,
  },
}

export const FiatPurchase: StoryObj = {
  render: () => (
    <>
      <FiatPurchaseSummaryItem
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Pending,
        }}
      />
      <FiatPurchaseSummaryItem
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <FiatPurchaseSummaryItem
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Cancelled,
        }}
      />
      <FiatPurchaseSummaryItem
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Failed,
        }}
      />
      <FiatPurchaseSummaryItem
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Success,
        }}
      />
      <FiatPurchaseSummaryItem
        transaction={{
          ...baseFaitPurchaseTx,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
