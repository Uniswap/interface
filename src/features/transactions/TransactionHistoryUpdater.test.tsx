import { MockedResponse } from '@apollo/client/testing'
import { faker } from '@faker-js/faker'
import { waitFor } from '@testing-library/react-native'
import dayjs from 'dayjs'
import MockDate from 'mockdate'
import React from 'react'
import { ChainId } from 'src/constants/chains'
import {
  TransactionHistoryUpdaterDocument,
  TransactionHistoryUpdaterQuery,
} from 'src/data/__generated__/types-and-hooks'
import { AssetType } from 'src/entities/assets'
import { AppNotificationType } from 'src/features/notifications/types'
import {
  getReceiveNotificationFromData,
  TransactionHistoryUpdater,
} from 'src/features/transactions/TransactionHistoryUpdater'
import { TransactionStatus, TransactionType } from 'src/features/transactions/types'
import { Account } from 'src/features/wallet/accounts/types'
import { account, account2 } from 'src/test/fixtures'
import { MAX_FIXTURE_TIMESTAMP, Portfolios, PortfoliosWithReceive } from 'src/test/gqlFixtures'
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
  replaceAccountOptions: {
    isReplacingAccount: false,
    skipToSeedPhrase: false,
  },
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
    await waitFor(() =>
      expect(
        Object.keys(tree.store.getState().notifications.notificationStatus).length
      ).toBeGreaterThan(0)
    )
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

describe(getReceiveNotificationFromData, () => {
  it('returns app notification object with new receive', () => {
    const txnData = { portfolios: PortfoliosWithReceive }

    // Ensure all transactions will be "new" compared to this
    const newTimestamp = 1

    const notification = getReceiveNotificationFromData(txnData, account.address, newTimestamp)

    expect(notification).toEqual({
      txStatus: TransactionStatus.Success,
      chainId: ChainId.Mainnet,
      txHash: PortfoliosWithReceive[0].assetActivities[0]?.transaction.hash, // generated
      address: account.address,
      txId: '0x80cde0e2abd1bf5fadcf7ff9edf7ae13feec1c32',
      type: AppNotificationType.Transaction,
      txType: TransactionType.Receive,
      assetType: AssetType.Currency,
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      currencyAmountRaw: '1000000000000000000',
      sender: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    })
  })

  it('returns undefined if no receive txns found', () => {
    // No receive type txn in this mock
    const txnDataWithoutReceiveTxns = { portfolios: Portfolios }

    // Ensure all transactions will be "new" compared to this
    const newTimestamp = 1

    const notification = getReceiveNotificationFromData(
      txnDataWithoutReceiveTxns,
      account.address,
      newTimestamp
    )

    expect(notification).toBeUndefined()
  })

  it('returns undefined if receive is older than lastest status update timestamp', () => {
    const txnData = { portfolios: PortfoliosWithReceive }

    // Ensure all transactions will be "old" compared to this
    const oldTimestamp = (MAX_FIXTURE_TIMESTAMP + 1) * 1000 // convert to ms

    const notification = getReceiveNotificationFromData(txnData, account.address, oldTimestamp)

    expect(notification).toBeUndefined()
  })
})
