import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { TokenDocument } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { SendSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/SendSummaryItem'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import {
  ClassicTransactionDetails,
  SendTokenTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'

const meta: Meta<typeof SendSummaryItem> = {
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
              chain: 'OPTIMISM',
              address: null,
            },
          },
          result: {
            data: {
              token: {
                __typename: 'Token',
                address: null,
                chain: 'OPTIMISM',
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

const baseSendTx: Omit<ClassicTransactionDetails, 'status'> & {
  typeInfo: SendTokenTransactionInfo
} = {
  routing: Routing.CLASSIC,
  from: '0x76e4de46c21603545eaaf7daf25e54c0d06bafa9',
  addedTime: Date.now() - 30000,
  hash: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  id: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  options: { request: {} },
  chainId: 1,
  typeInfo: {
    type: TransactionType.Send,
    currencyAmountRaw: '50000000000000000',
    recipient: '0xa0c68c638235ee32657e8f720a23cec1bfc77c77',
    tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    assetType: AssetType.Currency,
    transactedUSDValue: 105.21800000000002,
  },
}

const baseNFTSendTx: Omit<ClassicTransactionDetails, 'status'> & {
  typeInfo: SendTokenTransactionInfo
} = {
  ...baseSendTx,
  typeInfo: {
    type: TransactionType.Send,
    recipient: '0xa0c68c638235ee32657e8f720a23cec1bfc77c77',
    tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    assetType: AssetType.ERC721,
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

export const Send: StoryObj = {
  render: () => (
    <>
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSendTx,
          status: TransactionStatus.Pending,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSendTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSendTx,
          status: TransactionStatus.Canceled,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSendTx,
          status: TransactionStatus.Failed,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSendTx,
          status: TransactionStatus.Success,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSendTx,
          chainId: UniverseChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}

export const NFTSend: StoryObj = {
  render: () => (
    <>
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTSendTx,
          status: TransactionStatus.Pending,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTSendTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTSendTx,
          status: TransactionStatus.Canceled,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTSendTx,
          status: TransactionStatus.Failed,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTSendTx,
          status: TransactionStatus.Success,
        }}
      />
      <SendSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseNFTSendTx,
          chainId: UniverseChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
