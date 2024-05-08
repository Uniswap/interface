import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { TokenDocument } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { WrapSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/WrapSummaryItem'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  WrapTransactionInfo,
} from 'wallet/src/features/transactions/types'

const meta: Meta<typeof WrapSummaryItem> = {
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
        {
          request: {
            query: TokenDocument,
            variables: {
              chain: 'ETHEREUM',
              address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            },
          },
          result: {
            data: {
              token: {
                __typename: 'Token',
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                chain: 'ETHEREUM',
                decimals: 18,
                id: 'VG9rZW46RVRIRVJFVU1fMHhjMDJhYWEzOWIyMjNmZThkMGEwZTVjNGYyN2VhZDkwODNjNzU2Y2My',
                name: 'Wrapped Ether',
                project: {
                  __typename: 'TokenProject',
                  id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4ODJhRjQ5NDQ3RDhhMDdlM2JkOTVCRDBkNTZmMzUyNDE1MjNmQmFiMQ==',
                  isSpam: false,
                  logoUrl:
                    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                  safetyLevel: 'VERIFIED',
                },
                symbol: 'WETH',
              },
            },
          },
        },
      ],
    },
  },
}

export default meta

const baseWrapTx: Omit<TransactionDetails, 'status'> & { typeInfo: WrapTransactionInfo } = {
  from: '0x76e4de46c21603545eaaf7daf25e54c0d06bafa9',
  addedTime: Date.now() - 30000,
  hash: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  id: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  options: { request: {} },
  chainId: 1,
  typeInfo: {
    currencyAmountRaw: '10000000000000000',
    type: TransactionType.Wrap,
    unwrapped: false,
  },
}

const baseUnwrapTx: Omit<TransactionDetails, 'status'> & { typeInfo: WrapTransactionInfo } = {
  ...baseWrapTx,
  typeInfo: {
    ...baseWrapTx.typeInfo,
    unwrapped: true,
  },
}

export const Wrap: StoryObj = {
  render: () => (
    <>
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseWrapTx,
          status: TransactionStatus.Pending,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseWrapTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseWrapTx,
          status: TransactionStatus.Canceled,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseWrapTx,
          status: TransactionStatus.Failed,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseWrapTx,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}

export const Unwrap: StoryObj = {
  render: () => (
    <>
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnwrapTx,
          status: TransactionStatus.Pending,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnwrapTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnwrapTx,
          status: TransactionStatus.Canceled,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnwrapTx,
          status: TransactionStatus.Failed,
        }}
      />
      <WrapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseUnwrapTx,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
