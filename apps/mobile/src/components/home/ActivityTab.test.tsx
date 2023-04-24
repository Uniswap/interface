import { MockedResponse } from '@apollo/client/testing'
import React from 'react'
import { ActivityTab } from 'src/components/home/ActivityTab'
import {
  Chain,
  TokenDocument,
  TokenQuery,
  TransactionListDocument,
  TransactionListQuery,
} from 'src/data/__generated__/types-and-hooks'
import { ACCOUNT_ADDRESS_ONE, mockWalletPreloadedState } from 'src/test/fixtures'
import { DaiAsset, Portfolios } from 'src/test/gqlFixtures'
import { act, render } from 'src/test/test-utils'
import { sleep } from 'src/utils/timing'

const TransactionListMock: MockedResponse<TransactionListQuery> = {
  request: {
    query: TransactionListDocument,
    variables: {
      address: ACCOUNT_ADDRESS_ONE,
    },
  },
  result: {
    data: {
      portfolios: Portfolios,
    },
  },
}

/**
 * Need to mock responses for the BalanceUpdate query that queries for this data
 * if needed.
 */

const TokenMock: MockedResponse<TokenQuery> = {
  request: {
    query: TokenDocument,
    variables: {
      chain: Chain.Ethereum,
      address: DaiAsset.address?.toLowerCase(),
    },
  },
  result: {
    data: {
      token: DaiAsset,
    },
  },
}

const TokenNullMock: MockedResponse<TokenQuery> = {
  request: {
    query: TokenDocument,
    variables: {
      chain: Chain.Ethereum,
      address: null,
    },
  },
  result: {
    data: {
      token: undefined,
    },
  },
}

describe('ActivityTab', () => {
  it('renders without error', async () => {
    const tokensTabScrollHandler = (): undefined => undefined

    const tree = render(
      <ActivityTab owner={ACCOUNT_ADDRESS_ONE} scrollHandler={tokensTabScrollHandler} />,
      {
        mocks: [TransactionListMock, TokenMock, TokenNullMock],
        preloadedState: mockWalletPreloadedState,
      }
    )

    // Loading
    expect(tree.toJSON()).toMatchSnapshot()

    // Render items
    await act(async () => {
      await sleep(1000) // Wait for the loading to complete
    })

    expect(tree.toJSON()).toMatchSnapshot()
  })
})
