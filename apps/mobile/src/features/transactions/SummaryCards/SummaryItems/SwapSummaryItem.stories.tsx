import type { Meta, StoryObj } from '@storybook/react'
import { TradeType } from '@uniswap/sdk-core'
import React from 'react'
import { TokenDocument } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { SwapSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/SwapSummaryItem'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { buildCurrencyId, buildNativeCurrencyId } from 'wallet/src/utils/currencyId'

const meta: Meta<typeof SwapSummaryItem> = {
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
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            },
          },
          result: {
            data: {
              token: {
                __typename: 'Token',
                address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                chain: 'ETHEREUM',
                decimals: 18,
                id: 'VG9rZW46RVRIRVJFVU1fMHg2QjE3NTQ3NEU4OTA5NEM0NERhOThiOTU0RWVkZUFDNDk1MjcxZDBG',
                name: 'Dai Stablecoin',
                project: {
                  __typename: 'TokenProject',
                  id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4REExMDAwOWNCZDVEMDdkZDBDZUNjNjYxNjFGQzkzRDdjOTAwMGRhMQ==',
                  isSpam: false,
                  logoUrl:
                    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
                  safetyLevel: 'VERIFIED',
                },
                symbol: 'DAI',
              },
            },
          },
        },
      ],
    },
  },
}

export default meta

const baseSwapTx: Omit<TransactionDetails, 'status'> & {
  typeInfo: ExactOutputSwapTransactionInfo | ExactInputSwapTransactionInfo
} = {
  from: '0x76e4de46c21603545eaaf7daf25e54c0d06bafa9',
  addedTime: Date.now() - 30000,
  hash: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  id: '0x3ba4b82fb3bcb237cff0180b4fb4f94902cde2cfa56c57567b59b5608590d077',
  options: { request: {} },
  chainId: 1,
  typeInfo: {
    type: TransactionType.Swap,
    tradeType: TradeType.EXACT_OUTPUT,
    outputCurrencyAmountRaw: '50000000000000000',
    expectedInputCurrencyAmountRaw: '50000000000000000',
    maximumInputCurrencyAmountRaw: '50000000000000000',
    inputCurrencyId: buildNativeCurrencyId(ChainId.Mainnet),
    outputCurrencyId: buildCurrencyId(
      ChainId.Mainnet,
      '0x6b175474e89094c44da98b954eedeac495271d0f'
    ),
    transactedUSDValue: 105.21800000000002,
  },
}

export const Swap: StoryObj = {
  render: () => (
    <>
      <SwapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSwapTx,
          status: TransactionStatus.Pending,
        }}
      />
      <SwapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSwapTx,
          status: TransactionStatus.Cancelling,
        }}
      />
      <SwapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSwapTx,
          status: TransactionStatus.Canceled,
        }}
      />
      <SwapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSwapTx,
          status: TransactionStatus.Failed,
        }}
      />
      <SwapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSwapTx,
          status: TransactionStatus.Success,
        }}
      />
      <SwapSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseSwapTx,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
