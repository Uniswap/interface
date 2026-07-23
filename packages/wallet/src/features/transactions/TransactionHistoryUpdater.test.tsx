import { ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  Direction,
  OnChainTransaction,
  OnChainTransactionLabel,
  OnChainTransactionStatus,
  SpamCode as RestSpamCode,
  TokenType,
  Transaction,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import dayjs from 'dayjs'
import MockDate from 'mockdate'
import { DAI } from 'uniswap/src/constants/tokens'
import { getListTransactionsQuery, useListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { STALE_TRANSACTION_TIME_MS } from 'uniswap/src/features/notifications/constants'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import type { Mock } from 'vitest'
import {
  getReceiveNotificationFromData,
  TransactionHistoryUpdater,
} from 'wallet/src/features/transactions/TransactionHistoryUpdater'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { readOnlyAccount, receiveCurrencyTxNotification, signerMnemonicAccount } from 'wallet/src/test/fixtures'
import { faker, render } from 'wallet/src/test/test-utils'

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  // UniverseChainId.Mainnet — literal for Jest mock factory scope rules
  useEnabledChains: vi.fn(() => ({ chains: [1] })),
}))

vi.mock('uniswap/src/data/rest/listTransactions', () => ({
  useListTransactionsQuery: vi.fn(),
  getListTransactionsQuery: vi.fn(),
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

const SENDER = SAMPLE_SEED_ADDRESS_1
const OTHER = SAMPLE_SEED_ADDRESS_2

const erc20TokenRest = {
  address: DAI.address,
  symbol: 'DAI',
  decimals: 18,
  type: TokenType.ERC20,
  chainId: UniverseChainId.Mainnet,
  metadata: { spamCode: RestSpamCode.NOT_SPAM },
}

function wrapOnChain(onChain: OnChainTransaction): Transaction {
  return new Transaction({
    transaction: { case: 'onChain', value: onChain },
  })
}

function makeSendOnChain(params: { transactionHash: string; timestampMillis: bigint }): OnChainTransaction {
  return {
    chainId: UniverseChainId.Mainnet,
    blockNumber: 1,
    transactionHash: params.transactionHash,
    timestampMillis: params.timestampMillis,
    from: SENDER,
    to: OTHER,
    label: OnChainTransactionLabel.SEND,
    status: OnChainTransactionStatus.CONFIRMED,
    transfers: [
      {
        direction: Direction.SEND,
        asset: { case: 'token', value: erc20TokenRest },
        amount: { amount: 1, raw: '1' },
        to: OTHER,
      },
    ],
    approvals: [],
  } as unknown as OnChainTransaction
}

function makeReceiveOnChain(params: {
  transactionHash: string
  timestampMillis: bigint
  recipient: Address
}): OnChainTransaction {
  return {
    chainId: UniverseChainId.Mainnet,
    blockNumber: 1,
    transactionHash: params.transactionHash,
    timestampMillis: params.timestampMillis,
    from: SENDER,
    to: params.recipient,
    label: OnChainTransactionLabel.RECEIVE,
    status: OnChainTransactionStatus.CONFIRMED,
    transfers: [
      {
        direction: Direction.RECEIVE,
        asset: { case: 'token', value: erc20TokenRest },
        amount: { amount: 1, raw: '1000000000000000000' },
        to: params.recipient,
        from: SENDER,
      },
    ],
    approvals: [],
  } as unknown as OnChainTransaction
}

function listResponseFromOnChain(onChains: OnChainTransaction[]): ListTransactionsResponse {
  return new ListTransactionsResponse({
    transactions: onChains.map((oc) => wrapOnChain(oc)),
  })
}

const sendTxAfterLastPollA = makeSendOnChain({
  transactionHash: `0x${faker.datatype.hexadecimal({ length: 64 })}`,
  timestampMillis: BigInt(past.add(10, 'day').valueOf()),
})
const sendTxAfterLastPollB = makeSendOnChain({
  transactionHash: `0x${faker.datatype.hexadecimal({ length: 64 })}`,
  timestampMillis: BigInt(past.add(11, 'day').valueOf()),
})

const pollPageWithNewTxns = listResponseFromOnChain([sendTxAfterLastPollA, sendTxAfterLastPollB])

const RECEIVE_TX_HASH = `0x${faker.datatype.hexadecimal({ length: 64 })}`

const receiveOnChainStale = makeReceiveOnChain({
  transactionHash: RECEIVE_TX_HASH,
  timestampMillis: BigInt(Date.now() - STALE_TRANSACTION_TIME_MS * 2),
  recipient: account1.address,
})

let fetchQueryListResponse: ListTransactionsResponse = new ListTransactionsResponse({ transactions: [] })

function setDefaultRestMocks(): void {
  ;(useListTransactionsQuery as Mock).mockReturnValue({
    data: { pages: [pollPageWithNewTxns], pageParams: [undefined] },
    isLoading: false,
    isFetching: false,
    error: undefined,
    refetch: vi.fn(),
    status: 'success',
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    dataUpdatedAt: Date.now(),
  })

  ;(getListTransactionsQuery as Mock).mockImplementation(() => ({
    queryKey: [ReactQueryCacheKey.ListTransactions, 'test'],
    queryFn: async (): Promise<ListTransactionsResponse> => fetchQueryListResponse,
  }))
}

describe(TransactionHistoryUpdater, () => {
  beforeEach(() => {
    MockDate.reset()
    vi.clearAllMocks()
    ;(useEnabledChains as Mock).mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    fetchQueryListResponse = new ListTransactionsResponse({ transactions: [] })
    setDefaultRestMocks()
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
      preloadedState: reduxState,
    })

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account1.address}`)
    expect(element).toBeDefined()

    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account1.address]).toBeTruthy()
  })

  it('does not update notification status when there are no new transactions', async () => {
    const reduxState = {
      wallet: {
        ...walletSlice,
        activeAccountAddress: account1.address,
      },
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
      preloadedState: reduxState,
    })

    const element = await tree.findByTestId(`AddressTransactionHistoryUpdater/${account1.address}`)
    expect(element).toBeDefined()

    const notificationStatusState = tree.store.getState().notifications.notificationStatus
    expect(notificationStatusState[account1.address]).toBeFalsy()
  })

  it('does not update notification status if it is the first time fetching transactions', async () => {
    MockDate.set(present.valueOf())

    const reduxState = {
      wallet: {
        ...walletSlice,
        activeAccountAddress: account1.address,
      },
      notifications: {
        notificationQueue: [],
        notificationStatus: {},
        lastTxNotificationUpdate: {},
      },
    }

    const tree = render(<TransactionHistoryUpdater />, {
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
    const receiveTx = wrapOnChain(
      makeReceiveOnChain({
        transactionHash: RECEIVE_TX_HASH,
        timestampMillis: BigInt(Math.floor(Date.now() - ONE_MINUTE_MS * 5)),
        recipient: account1.address,
      }),
    )

    const newTimestamp = 1

    const notification = getReceiveNotificationFromData({
      transactions: [receiveTx],
      address: account1.address,
      lastTxNotificationUpdateTimestamp: newTimestamp,
    })

    expect(notification).toEqual(
      receiveCurrencyTxNotification({
        address: account1.address,
        txStatus: TransactionStatus.Success,
        txId: RECEIVE_TX_HASH,
        sender: SENDER,
        tokenAddress: DAI.address,
        chainId: UniverseChainId.Mainnet,
        currencyAmountRaw: expect.any(String) as unknown as string,
      }),
    )
  })

  it('returns undefined if no receive txns found', () => {
    const sendOnly = wrapOnChain(
      makeSendOnChain({
        transactionHash: `0x${faker.datatype.hexadecimal({ length: 64 })}`,
        timestampMillis: BigInt(Date.now()),
      }),
    )

    const newTimestamp = 1

    const notification = getReceiveNotificationFromData({
      transactions: [sendOnly],
      address: account1.address,
      lastTxNotificationUpdateTimestamp: newTimestamp,
    })

    expect(notification).toBeUndefined()
  })

  it('returns undefined if receive is older than latest status update timestamp', () => {
    MockDate.set(now)
    const receiveTx = wrapOnChain(
      makeReceiveOnChain({
        transactionHash: RECEIVE_TX_HASH,
        timestampMillis: BigInt(Date.now() - ONE_MINUTE_MS * 5),
        recipient: account1.address,
      }),
    )

    const oldTimestamp = Date.now() - ONE_MINUTE_MS

    const notification = getReceiveNotificationFromData({
      transactions: [receiveTx],
      address: account1.address,
      lastTxNotificationUpdateTimestamp: oldTimestamp,
    })

    expect(notification).toBeUndefined()
  })

  it('returns undefined if receive is too stale to notify', () => {
    MockDate.set(now)
    const receiveTx = wrapOnChain(receiveOnChainStale)

    const newTimestamp = 1

    const notification = getReceiveNotificationFromData({
      transactions: [receiveTx],
      address: account1.address,
      lastTxNotificationUpdateTimestamp: newTimestamp,
    })

    expect(notification).toBeUndefined()
  })
})
