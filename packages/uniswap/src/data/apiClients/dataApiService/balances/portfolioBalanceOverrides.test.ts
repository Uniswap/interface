import 'utilities/src/logger/mocks'
import { configureStore } from '@reduxjs/toolkit'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  cleanupCaughtUpOverrides,
  getBalanceOverrideStateForAddress,
  getOverridesForAddress,
  initializePortfolioQueryOverrides,
  storeBalanceOverrideSnapshots,
} from 'uniswap/src/data/apiClients/dataApiService/balances/portfolioBalanceOverrides'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  addTokensToBalanceOverride,
  portfolioReducer,
  removeExpiredBalanceOverrides,
  resetPortfolio,
} from 'uniswap/src/features/portfolio/slice/slice'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const OWNER_ADDRESS = '0x1234567890123456789012345678901234567890'
const NEW_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222'
const NEW_TOKEN_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, NEW_TOKEN_ADDRESS).toLowerCase()
const OTHER_TOKEN_CURRENCY_ID = buildCurrencyId(
  UniverseChainId.Mainnet,
  '0x3333333333333333333333333333333333333333',
).toLowerCase()

const balanceSnapshot = (amount: number): Balance =>
  ({
    token: { chainId: UniverseChainId.Mainnet, address: NEW_TOKEN_ADDRESS },
    amount: { amount, raw: amount.toString() },
  }) as Balance

const createStoreWithOverride = () => {
  const store = configureStore({ reducer: { portfolio: portfolioReducer } })
  initializePortfolioQueryOverrides({ store })
  store.dispatch(
    addTokensToBalanceOverride({
      ownerAddress: OWNER_ADDRESS,
      currencyIds: [NEW_TOKEN_CURRENCY_ID],
    }),
  )
  return store
}

describe(cleanupCaughtUpOverrides, () => {
  const backendResponse = (amount?: number): GetPortfolioResponse =>
    new GetPortfolioResponse({
      portfolio: {
        balances: amount === undefined ? [] : [balanceSnapshot(amount)],
      },
    })

  it('keeps an override when a partial on-chain refresh omits a newly acquired token', () => {
    createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })

    cleanupCaughtUpOverrides({
      ownerAddress: OWNER_ADDRESS,
      originalData: backendResponse(),
      balanceSnapshots: new Map(),
      expectedGenerations: generations,
    })

    expect(getOverridesForAddress({ address: OWNER_ADDRESS })).toContain(NEW_TOKEN_CURRENCY_ID)
  })

  it('keeps a positive balance snapshot while the backend still omits the token', () => {
    createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: generations,
    })

    cleanupCaughtUpOverrides({
      ownerAddress: OWNER_ADDRESS,
      originalData: backendResponse(),
      balanceSnapshots: getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots,
      expectedGenerations: generations,
    })

    expect(getOverridesForAddress({ address: OWNER_ADDRESS })).toContain(NEW_TOKEN_CURRENCY_ID)
  })

  it('keeps a positive balance snapshot while the backend reports a different positive amount', () => {
    createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })

    cleanupCaughtUpOverrides({
      ownerAddress: OWNER_ADDRESS,
      originalData: backendResponse(4),
      balanceSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: generations,
    })

    expect(getOverridesForAddress({ address: OWNER_ADDRESS })).toContain(NEW_TOKEN_CURRENCY_ID)
  })

  it('removes an override after the backend catches up to the balance snapshot', () => {
    createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })

    cleanupCaughtUpOverrides({
      ownerAddress: OWNER_ADDRESS,
      originalData: backendResponse(5),
      balanceSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: generations,
    })

    expect(getOverridesForAddress({ address: OWNER_ADDRESS })).not.toContain(NEW_TOKEN_CURRENCY_ID)
    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(new Map())
  })

  it('removes a zero balance override after the backend stops returning the token', () => {
    createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })

    cleanupCaughtUpOverrides({
      ownerAddress: OWNER_ADDRESS,
      originalData: backendResponse(),
      balanceSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(0)]]),
      expectedGenerations: generations,
    })

    expect(getOverridesForAddress({ address: OWNER_ADDRESS })).not.toContain(NEW_TOKEN_CURRENCY_ID)
  })

  it('does not remove a newer override when an older reconciliation catches up', () => {
    const store = createStoreWithOverride()
    const { generations: staleGenerations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(4)]]),
      expectedGenerations: staleGenerations,
    })

    store.dispatch(
      addTokensToBalanceOverride({
        ownerAddress: OWNER_ADDRESS,
        currencyIds: [NEW_TOKEN_CURRENCY_ID],
      }),
    )
    const { generations: currentGenerations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    const currentSnapshot = balanceSnapshot(7)
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, currentSnapshot]]),
      expectedGenerations: currentGenerations,
    })

    cleanupCaughtUpOverrides({
      ownerAddress: OWNER_ADDRESS,
      originalData: backendResponse(5),
      balanceSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: staleGenerations,
    })

    expect(getOverridesForAddress({ address: OWNER_ADDRESS })).toContain(NEW_TOKEN_CURRENCY_ID)
    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(
      new Map([[NEW_TOKEN_CURRENCY_ID, currentSnapshot]]),
    )
  })
})

describe(storeBalanceOverrideSnapshots, () => {
  it('stores snapshots outside persisted Redux state', () => {
    const store = createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    const snapshot = balanceSnapshot(5)

    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, snapshot]]),
      expectedGenerations: generations,
    })

    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(
      new Map([[NEW_TOKEN_CURRENCY_ID, snapshot]]),
    )
    expect(
      Object.keys(store.getState().portfolio.tokenBalanceOverrides[OWNER_ADDRESS]?.[NEW_TOKEN_CURRENCY_ID] ?? {}),
    ).not.toContain('balanceSnapshot')
  })

  it('rejects a stale snapshot after the same token gets a new override generation', () => {
    const store = createStoreWithOverride()
    const { generations: staleGenerations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(4)]]),
      expectedGenerations: staleGenerations,
    })

    store.dispatch(
      addTokensToBalanceOverride({
        ownerAddress: OWNER_ADDRESS,
        currencyIds: [NEW_TOKEN_CURRENCY_ID],
      }),
    )
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: staleGenerations,
    })

    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(new Map())
  })

  it('prunes snapshots when the override is reset', () => {
    const store = createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: generations,
    })

    store.dispatch(resetPortfolio())

    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(new Map())
  })

  it('prunes snapshots when the override expires', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-27T00:00:00Z'))

    const store = createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: generations,
    })

    vi.advanceTimersByTime(31 * 60 * 1000)
    store.dispatch(removeExpiredBalanceOverrides())

    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(new Map())

    vi.useRealTimers()
  })

  it('clears snapshots when initialized with a different Redux store', () => {
    createStoreWithOverride()
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: generations,
    })

    createStoreWithOverride()

    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(new Map())
  })

  it('supports legacy persisted overrides without a generation', () => {
    const store = configureStore({
      reducer: { portfolio: portfolioReducer },
      preloadedState: {
        portfolio: {
          tokenBalanceOverrides: {
            [OWNER_ADDRESS]: {
              [NEW_TOKEN_CURRENCY_ID]: { updatedAt: Date.now() },
            },
          },
        },
      },
    })
    initializePortfolioQueryOverrides({ store })
    const { generations } = getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS })
    const snapshot = balanceSnapshot(5)

    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[NEW_TOKEN_CURRENCY_ID, snapshot]]),
      expectedGenerations: generations,
    })

    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(
      new Map([[NEW_TOKEN_CURRENCY_ID, snapshot]]),
    )
  })

  it('does not store a null-generation snapshot without an active override', () => {
    createStoreWithOverride()

    storeBalanceOverrideSnapshots({
      ownerAddress: OWNER_ADDRESS,
      nextSnapshots: new Map([[OTHER_TOKEN_CURRENCY_ID, balanceSnapshot(5)]]),
      expectedGenerations: new Map([[OTHER_TOKEN_CURRENCY_ID, null]]),
    })

    expect(getBalanceOverrideStateForAddress({ address: OWNER_ADDRESS }).snapshots).toEqual(new Map())
  })
})
