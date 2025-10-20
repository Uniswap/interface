import { GraphQLApi } from '@universe/api'
import dayjs from 'dayjs'
import MockDate from 'mockdate'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { erc20RecentReceiveAssetActivity, erc20StaleReceiveAssetActivity, portfolio } from 'uniswap/src/test/fixtures'
import { queryResolvers } from 'uniswap/src/test/utils'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import {
  getReceiveNotificationFromData,
  TransactionHistoryUpdater,
} from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { readOnlyAccount, receiveCurrencyTxNotification, signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { faker, render } from 'wallet/src/test/test-utils'

const mockedRefetchQueries = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: jest.fn((): { refetchQueries: jest.Mock } => ({
    refetchQueries: mockedRefetchQueries,
  })),
}))

const now = Date.now()

const present = dayjs('2022-02-01')
const past = present.subtract(1, 'month')
const future = present.add(1, 'month')

const account1 = signerMnemonicAccount()
const account2 = readOnlyAccount()

const accounts: Record<Address, Account> = {
  [account1.address]: account1,
  [account2.address]: account2,
}

const walletSlice = {
  accounts,
  activeAccountAddress: null,
  settings: {
    swapProtection: SwapProtectionSetting.On,
    hideSmallBalances: true,
    hideSpamTokens: true,
  },
  replaceAccountOptions: {
    isReplacingAccount: false,
    skipToSeedPhrase: false,
  },
  androidCloudBackupEmail: null,
}

const assetActivities = [
  {
    id: faker.datatype.uuid(),
    timestamp: past.unix(),
  },
  {
    id: faker.datatype.uuid(),
    timestamp: past.add(1, 'day').unix(),
  },
] as GraphQLApi.AssetActivity[]

const assetActivities2 = [
  {
    id: faker.datatype.uuid(),
    timestamp: past.unix(),
  },
  {
    id: faker.datatype.uuid(),
    timestamp: past.add(1, 'day').unix(),
  },
  {
    id: faker.datatype.uuid(),
    timestamp: past.add(2, 'day').unix(),
  },
] as GraphQLApi.AssetActivity[]

const portfolios = [
  portfolio({ ownerAddress: account1.address, assetActivities }),
  portfolio({ ownerAddress: account2.address, assetActivities: assetActivities2 }),
]

const receiveAssetActivity = erc20RecentReceiveAssetActivity()
const portfolioWithReceive = portfolio({
  ownerAddress: account1.address,
  assetActivities: [receiveAssetActivity],
})
const portfolioWithStaleReceive = portfolio({
  ownerAddress: account1.address,
  assetActivities: [erc20StaleReceiveAssetActivity()],
})
const portfolioWithNoReceive = portfolio({
  ownerAddress: account1.address,
  assetActivities: [],
})

const { resolvers } = queryResolvers({
  portfolios: (_, { ownerAddresses }) => portfolios.filter((p) => ownerAddresses.includes(p.ownerAddress)),
})

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
      preloadedState: reduxState,
    })

    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('updates notification status when there are new transactions', async () => {
    const reduxState = {
      wallet: {
        ...walletSlice,
        activeAccountAddress: account1.address,
      },
      notifications: {
        notificationQueue: [],
        notificationStatus: {},
        lastTxNotificationUpdate: {
          [account1.address]: past.valueOf(),
          [account2.address]: past.valueOf(),
        },
      },
    }

    const tree = render(<TransactionHistoryUpdater />, {
      resolvers,
      preloadedState: reduxState,
    })

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account1.address}`)
    expect(element).toBeDefined()

    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account1.address]).toBeTruthy()
    expect(notificationStatusState[account2.address]).toBeTruthy()
    expect(mockedRefetchQueries).toHaveBeenCalled()
  })

  it('does not update notification status when there are no new transactions', async () => {
    const reduxState = {
      wallet: walletSlice,
      notifications: {
        notificationQueue: [],
        notificationStatus: {},
        lastTxNotificationUpdate: {
          [account1.address]: future.valueOf(),
          [account2.address]: future.valueOf(),
        },
      },
    }

    const tree = render(<TransactionHistoryUpdater />, {
      resolvers,
      preloadedState: reduxState,
    })

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account1.address}`)
    expect(element).toBeDefined()

    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account1.address]).toBeFalsy()
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
      resolvers,
      preloadedState: reduxState,
    })

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account1.address}`)
    expect(element).toBeDefined()

    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account1.address]).toBeFalsy()
    expect(notificationStatusState[account2.address]).toBeFalsy()
  })
})

describe(getReceiveNotificationFromData, () => {
  it('returns app notification object with new receive', () => {
    const txnData = { portfolios: [portfolioWithReceive] }

    // Ensure all transactions will be "new" compared to this
    const newTimestamp = 1

    const notification = getReceiveNotificationFromData({
      data: txnData,
      address: account1.address,
      lastTxNotificationUpdateTimestamp: newTimestamp,
    })

    const assetChange = receiveAssetActivity.details.assetChanges[0]!

    expect(notification).toEqual(
      receiveCurrencyTxNotification({
        address: account1.address,
        txStatus: TransactionStatus.Success,
        txId: receiveAssetActivity.details.hash,
        sender: assetChange.sender,
        tokenAddress: assetChange.asset.address,
        chainId: fromGraphQLChain(assetChange.asset.chain)!,
        // This is calculated based on a few different fields and we don't
        // have to check if the calculation is correct in this test.
        // It's better to test the calculation in a separate test.
        currencyAmountRaw: expect.any(String),
      }),
    )
  })

  it('returns undefined if no receive txns found', () => {
    // No receive type txn in this mock
    const txnDataWithoutReceiveTxns = { portfolios: [portfolioWithNoReceive] }

    // Ensure all transactions will be "new" compared to this
    const newTimestamp = 1

    const notification = getReceiveNotificationFromData({
      data: txnDataWithoutReceiveTxns,
      address: account1.address,
      lastTxNotificationUpdateTimestamp: newTimestamp,
    })

    expect(notification).toBeUndefined()
  })

  it('returns undefined if receive is older than latest status update timestamp', () => {
    MockDate.set(now)
    const txnData = { portfolios: [portfolioWithReceive] }

    // Ensure all transactions will be "old" compared to this
    // mocked receive is made to be 5 minutes ago
    const oldTimestamp = Date.now() - ONE_MINUTE_MS

    const notification = getReceiveNotificationFromData({
      data: txnData,
      address: account1.address,
      lastTxNotificationUpdateTimestamp: oldTimestamp,
    })

    expect(notification).toBeUndefined()
  })

  it('returns undefined if receive is too stale to notify', () => {
    MockDate.set(now)
    const txnData = { portfolios: [portfolioWithStaleReceive] }

    // Ensure all transactions will be "old" compared to this
    // mocked receive is made to be 5 minutes ago
    const newTimestamp = 1

    const notification = getReceiveNotificationFromData({
      data: txnData,
      address: account1.address,
      lastTxNotificationUpdateTimestamp: newTimestamp,
    })

    expect(notification).toBeUndefined()
  })
})
