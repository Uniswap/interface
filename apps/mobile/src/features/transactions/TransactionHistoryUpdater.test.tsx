import { MockedResponse } from '@apollo/client/testing'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import MockDate from 'mockdate'
import React from 'react'
import {
  getReceiveNotificationFromData,
  TransactionHistoryUpdater,
} from 'src/features/transactions/TransactionHistoryUpdater'
import { MAX_FIXTURE_TIMESTAMP, Portfolios, PortfoliosWithReceive } from 'src/test/gqlFixtures'
import { render } from 'src/test/test-utils'
import { ChainId } from 'wallet/src/constants/chains'
import {
  TransactionHistoryUpdaterDocument,
  TransactionHistoryUpdaterQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { AssetType } from 'wallet/src/entities/assets'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { account, account2, SAMPLE_SEED_ADDRESS_1 } from 'wallet/src/test/fixtures'

const mockedRefetchQueries = jest.fn()
jest.mock('src/data/usePersistedApolloClient', () => ({
  apolloClient: { refetchQueries: mockedRefetchQueries },
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
  isUnlocked: false,
  settings: {
    swapProtection: SwapProtectionSetting.On,
  },
  replaceAccountOptions: {
    isReplacingAccount: false,
    skipToSeedPhrase: false,
  },
}

const dummyDetails = {
  id: faker.datatype.uuid(),
  hash: faker.datatype.uuid(),
}

const assetActivities = [
  {
    id: faker.datatype.uuid(),
    timestamp: past.unix(),
    details: dummyDetails,
  },
  {
    id: faker.datatype.uuid(),
    timestamp: past.add(1, 'day').unix(),
    details: dummyDetails,
  },
]

const assetActivities2 = [
  {
    id: faker.datatype.uuid(),
    timestamp: past.unix(),
    details: dummyDetails,
  },
  {
    id: faker.datatype.uuid(),
    timestamp: past.add(1, 'day').unix(),
    details: dummyDetails,
  },
  {
    id: faker.datatype.uuid(),
    timestamp: past.add(2, 'day').unix(),
    details: dummyDetails,
  },
]

const portfolioData = [
  {
    ...Portfolios[0],
    ownerAddress: account.address,
    assetActivities,
  },
  {
    ...Portfolios[1],
    ownerAddress: account2.address,
    assetActivities: assetActivities2,
  },
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

  it('skips rendering when no accounts available', () => {
    const reduxState = {
      wallet: {
        ...walletSlice,
        accounts: {},
      },
    }

    const tree = render(<TransactionHistoryUpdater />, {
      mocks: [mock],
      preloadedState: reduxState,
    })

    expect(tree.toJSON()).toEqual(null)
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

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account.address}`)
    expect(element).toBeDefined()

    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account.address]).toBeTruthy()
    expect(notificationStatusState[account2.address]).toBeTruthy()
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

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account.address}`)
    expect(element).toBeDefined()

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

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account.address}`)
    expect(element).toBeDefined()

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
      txHash: PortfoliosWithReceive[0].assetActivities[0]?.details.hash, // generated
      address: account.address,
      txId: '0x80cde0e2abd1bf5fadcf7ff9edf7ae13feec1c32',
      type: AppNotificationType.Transaction,
      txType: TransactionType.Receive,
      assetType: AssetType.Currency,
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      currencyAmountRaw: '1000000000000000000',
      sender: SAMPLE_SEED_ADDRESS_1,
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
