import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import {
  Chain,
  TokenDocument,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { FiatPurchaseSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/FiatPurchaseSummaryItem'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

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
        contractAddress: getNativeAddress(ChainId.Mainnet),
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
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Pending,
        }}
      />
      <FiatPurchaseSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <FiatPurchaseSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Canceled,
        }}
      />
      <FiatPurchaseSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Failed,
        }}
      />
      <FiatPurchaseSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          typeInfo: {
            ...baseFaitPurchaseTx.typeInfo,
            outputCurrencyAmount: null,
          },
          status: TransactionStatus.Failed,
        }}
      />
      <FiatPurchaseSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Success,
        }}
      />
      <FiatPurchaseSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          status: TransactionStatus.Success,
          typeInfo: {
            ...baseFaitPurchaseTx.typeInfo,
            outputCurrencyAmount: 123000000,
          },
        }}
      />
      <FiatPurchaseSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseFaitPurchaseTx,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
