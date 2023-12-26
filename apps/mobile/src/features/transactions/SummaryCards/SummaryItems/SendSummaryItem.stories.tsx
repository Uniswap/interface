import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import TransactionSummaryLayout from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { ChainId } from 'wallet/src/constants/chains'
import { TokenDocument } from 'wallet/src/data/__generated__/types-and-hooks'
import { AssetType } from 'wallet/src/entities/assets'
import { SendSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/SendSummaryItem'
import {
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

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

const baseSendTx: Omit<TransactionDetails, 'status'> & { typeInfo: SendTokenTransactionInfo } = {
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

const baseNFTSendTx: Omit<TransactionDetails, 'status'> & { typeInfo: SendTokenTransactionInfo } = {
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
          status: TransactionStatus.Cancelled,
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
          chainId: ChainId.Optimism,
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
          status: TransactionStatus.Cancelled,
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
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
