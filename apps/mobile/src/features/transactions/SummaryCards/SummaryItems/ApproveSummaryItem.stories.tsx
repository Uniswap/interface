import type { Meta, StoryObj } from '@storybook/react'
import { TokenDocument } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { ApproveSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/ApproveSummaryItem'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import {
  ApproveTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

const meta: Meta<typeof ApproveSummaryItem> = {
  title: 'WIP/Activity Items',
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: TokenDocument,
            variables: {
              chain: 'ETHEREUM',
              address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
            },
          },
          result: {
            data: {
              token: {
                __typename: 'Token',
                id: 'VG9rZW46RVRIRVJFVU1fMHgyYjU5MWU5OWFmZTlmMzJlYWE2MjE0ZjdiNzYyOTc2OGM0MGVlYjM5',
                name: 'HEX',
                symbol: 'HEX',
                decimals: 8,
                chain: 'ETHEREUM',
                address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
                project: {
                  __typename: 'TokenProject',
                  id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4NWZmNzcyYTM1MjkxQkZBOTJkNTYxNDQ3MzVjMEEzNzhlNjQyM0Y4NA==',
                  logoUrl:
                    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39/logo.png',
                  safetyLevel: 'MEDIUM_WARNING',
                  isSpam: false,
                },
              },
            },
          },
        },
        {
          request: {
            query: TokenDocument,
            variables: {
              chain: 'OPTIMISM',
              address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
            },
          },
          result: {
            data: {
              token: {
                __typename: 'Token',
                id: 'VG9rZW46RVRIRVJFVU1fMHgyYjU5MWU5OWFmZTlmMzJlYWE2MjE0ZjdiNzYyOTc2OGM0MGVlYjM5',
                name: 'HEX',
                symbol: 'HEX',
                decimals: 8,
                chain: 'ETHEREUM',
                address: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
                project: {
                  __typename: 'TokenProject',
                  id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4NWZmNzcyYTM1MjkxQkZBOTJkNTYxNDQ3MzVjMEEzNzhlNjQyM0Y4NA==',
                  logoUrl:
                    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39/logo.png',
                  safetyLevel: 'MEDIUM_WARNING',
                  isSpam: false,
                },
              },
            },
          },
        },
      ],
    },
  },
}

export default meta

const baseApproveTx: Omit<TransactionDetails, 'status'> & {
  typeInfo: ApproveTransactionInfo
} = {
  from: '',
  addedTime: Date.now() - 30000,
  hash: '',
  options: { request: {} },
  chainId: 1,
  id: '',
  typeInfo: {
    type: TransactionType.Approve,
    spender: '',
    approvalAmount: '1.0',
    tokenAddress: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
  },
}

const baseApproveUnlimitedTx = {
  ...baseApproveTx,
  typeInfo: {
    ...baseApproveTx.typeInfo,
    approvalAmount: 'INF',
  },
}

const baseRevokeTx = {
  ...baseApproveTx,
  typeInfo: {
    ...baseApproveTx.typeInfo,
    approvalAmount: '0.0',
  },
}

export const Approve: StoryObj = {
  render: () => (
    <>
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveTx,
          status: TransactionStatus.Pending,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveTx,
          status: TransactionStatus.Failed,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveTx,
          status: TransactionStatus.Success,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveUnlimitedTx,
          status: TransactionStatus.Pending,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveUnlimitedTx,
          status: TransactionStatus.Failed,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveUnlimitedTx,
          status: TransactionStatus.Success,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseApproveUnlimitedTx,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}

export const Revoke: StoryObj = {
  render: () => (
    <>
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseRevokeTx,
          status: TransactionStatus.Pending,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseRevokeTx,
          status: TransactionStatus.Failed,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseRevokeTx,
          status: TransactionStatus.Success,
        }}
      />
      <ApproveSummaryItem
        layoutElement={TransactionSummaryLayout}
        transaction={{
          ...baseRevokeTx,
          chainId: ChainId.Optimism,
          status: TransactionStatus.Success,
        }}
      />
    </>
  ),
}
