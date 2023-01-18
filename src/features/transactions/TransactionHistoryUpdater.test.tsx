import { MockedResponse } from '@apollo/client/testing'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import MockDate from 'mockdate'
import React from 'react'
import {
  TransactionHistoryUpdaterDocument,
  TransactionHistoryUpdaterQuery,
} from 'src/data/__generated__/types-and-hooks'
import { TransactionHistoryUpdater } from 'src/features/transactions/TransactionHistoryUpdater'
import { Account } from 'src/features/wallet/accounts/types'
import { account, account2 } from 'src/test/fixtures'
import { Portfolios } from 'src/test/gqlFixtures'
import { render } from 'src/test/test-utils'

const mockedRefetchQueries = jest.fn()
jest.mock('src/data/hooks', () => ({
  useRefetchQueries: (): jest.Mock => mockedRefetchQueries,
}))

const present = dayjs('2022-02-01')
const past = present.subtract(1, 'month')
const future = present.add(1, 'month')

const accounts: Record<Address, Account> = {
  [account.address]: account,
  [account2.address]: account2,
}

const walletSlice = {
  accounts,
  activeAccountAddress: null,
  flashbotsEnabled: false,
  isUnlocked: false,
  settings: {},
}

const assetActivities = [
  { id: faker.datatype.uuid(), timestamp: past.unix() },
  { id: faker.datatype.uuid(), timestamp: past.add(1, 'day').unix() },
]

const assetActivities2 = [
  { id: faker.datatype.uuid(), timestamp: past.unix() },
  { id: faker.datatype.uuid(), timestamp: past.add(1, 'day').unix() },
  { id: faker.datatype.uuid(), timestamp: past.add(2, 'day').unix() },
]

const portfolioData = [
  { ...Portfolios[0], ownerAddress: account.address, assetActivities },
  { ...Portfolios[1], ownerAddress: account2.address, assetActivities: assetActivities2 },
]

const mock: MockedResponse<TransactionHistoryUpdaterQuery> = {
  request: {
    query: TransactionHistoryUpdaterDocument,
    variables: { addresses: Object.keys(accounts) },
  },
  result: { data: { portfolios: portfolioData } },
}

describe(TransactionHistoryUpdater, () => {
  beforeEach(() => {
    MockDate.reset()
  })

  it('updates notification status when there are new transactions', async () => {
    const reduxState = {
      wallet: walletSlice,
      notifications: {
        notificationQueue: [],
        notificationStatus: {},
        lastTxNotificationUpdate: {
          [account.address]: past.valueOf(),
          [account2.address]: past.valueOf(),
        },
      },
    }

    const tree = render(<TransactionHistoryUpdater />, {
      mocks: [mock],
      preloadedState: reduxState,
    })

    expect(
      await tree.findByTestId(`AddressTransactionHistoryUpdater/${account.address}`)
    ).toBeDefined()
    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account.address]).toBeTruthy()
    expect(notificationStatusState[account2.address]).toBeTruthy()
    expect(mockedRefetchQueries).toHaveBeenCalledTimes(Object.keys(accounts).length)
  })

  it('does not update notification status when there are no new transactions', async () => {
    const reduxState = {
      wallet: walletSlice,
      notifications: {
        notificationQueue: [],
        notificationStatus: {},
        lastTxNotificationUpdate: {
          [account.address]: future.valueOf(),
          [account2.address]: future.valueOf(),
        },
      },
    }

    const tree = render(<TransactionHistoryUpdater />, {
      mocks: [mock],
      preloadedState: reduxState,
    })

    expect(
      await tree.findByTestId(`AddressTransactionHistoryUpdater/${account.address}`)
    ).toBeDefined()
    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account.address]).toBeFalsy()
    expect(notificationStatusState[account2.address]).toBeFalsy()
    expect(mockedRefetchQueries).not.toHaveBeenCalled()
  })

  it('does not update notification status if it is the first time fetching transactions', async () => {
    MockDate.set(present.valueOf())

    const reduxState = {
      wallet: walletSlice,
      notifications: {
        notificationQueue: [],
        notificationStatus: {},
        lastTxNotificationUpdate: {},
      },
    }

    const tree = render(<TransactionHistoryUpdater />, {
      mocks: [mock],
      preloadedState: reduxState,
    })

    expect(
      await tree.findByTestId(`AddressTransactionHistoryUpdater/${account.address}`)
    ).toBeDefined()
    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account.address]).toBeFalsy()
    expect(notificationStatusState[account2.address]).toBeFalsy()
  })
})
