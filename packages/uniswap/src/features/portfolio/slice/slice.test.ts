import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  addTokensToBalanceOverride,
  initialPortfolioState,
  portfolioReducer,
  removeExpiredBalanceOverrides,
  removeTokenFromBalanceOverride,
} from 'uniswap/src/features/portfolio/slice/slice'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const TEST_ADDRESS1 = '0x1234567890123456789012345678901234567890'
const TEST_ADDRESS2 = '0x0987654321098765432109876543210987654321'
const TEST_TOKEN_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01'
const TEST_CHAIN_ID = UniverseChainId.Mainnet

describe(portfolioReducer, () => {
  describe(addTokensToBalanceOverride, () => {
    it('adds token overrides for a valid address', () => {
      const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

      const state = portfolioReducer(
        initialPortfolioState,
        addTokensToBalanceOverride({
          ownerAddress: TEST_ADDRESS1,
          currencyIds: [currencyId],
        }),
      )

      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]).toBeDefined()
      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]?.[currencyId]).toBeDefined()
      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]?.[currencyId]?.updatedAt).toBeGreaterThan(0)
    })

    it('ignores invalid addresses', () => {
      const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

      const state = portfolioReducer(
        initialPortfolioState,
        addTokensToBalanceOverride({
          ownerAddress: 'invalid-address',
          currencyIds: [currencyId],
        }),
      )

      expect(state).toEqual(initialPortfolioState)
    })

    it('updates existing overrides', () => {
      const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

      let state = portfolioReducer(
        initialPortfolioState,
        addTokensToBalanceOverride({
          ownerAddress: TEST_ADDRESS1,
          currencyIds: [currencyId],
        }),
      )

      const firstTimestamp = state.tokenBalanceOverrides[TEST_ADDRESS1]![currencyId]!.updatedAt

      // Wait a small amount to ensure different timestamps
      jest.advanceTimersByTime(1000)

      state = portfolioReducer(
        state,
        addTokensToBalanceOverride({
          ownerAddress: TEST_ADDRESS1,
          currencyIds: [currencyId],
        }),
      )

      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]![currencyId]!.updatedAt).toBeGreaterThan(firstTimestamp)
    })
  })

  describe(removeTokenFromBalanceOverride, () => {
    it('removes token override for valid address', () => {
      const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

      let state = portfolioReducer(
        initialPortfolioState,
        addTokensToBalanceOverride({
          ownerAddress: TEST_ADDRESS1,
          currencyIds: [currencyId],
        }),
      )

      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]).toBeDefined()

      state = portfolioReducer(
        state,
        removeTokenFromBalanceOverride({
          ownerAddress: TEST_ADDRESS1,
          chainId: TEST_CHAIN_ID,
          tokenAddress: TEST_TOKEN_ADDRESS,
        }),
      )

      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]).toBeUndefined()
    })

    it('ignores invalid addresses', () => {
      const initialState = {
        ...initialPortfolioState,
        tokenBalanceOverrides: {
          [TEST_ADDRESS1]: {
            [buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)]: {
              updatedAt: Date.now(),
            },
          },
        },
      }

      const state = portfolioReducer(
        initialState,
        removeTokenFromBalanceOverride({
          ownerAddress: 'invalid-address',
          chainId: TEST_CHAIN_ID,
          tokenAddress: TEST_TOKEN_ADDRESS,
        }),
      )

      expect(state).toEqual(initialState)
    })
  })

  describe(removeExpiredBalanceOverrides, () => {
    it('removes expired overrides', () => {
      const now = Date.now()
      const currencyId = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)

      const initialState = {
        ...initialPortfolioState,
        tokenBalanceOverrides: {
          [TEST_ADDRESS1]: {
            [currencyId]: {
              updatedAt: now - 31 * 60 * 1000, // 31 minutes ago (expired)
            },
          },
          [TEST_ADDRESS2]: {
            [currencyId]: {
              updatedAt: now - 29 * 60 * 1000, // 29 minutes ago (not expired)
            },
          },
        },
      }

      const state = portfolioReducer(initialState, removeExpiredBalanceOverrides())

      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]).toBeUndefined()
      expect(state.tokenBalanceOverrides[TEST_ADDRESS2]).toBeDefined()
    })

    it('removes account entry when all overrides are expired', () => {
      const now = Date.now()
      const currencyId1 = buildCurrencyId(TEST_CHAIN_ID, TEST_TOKEN_ADDRESS)
      const currencyId2 = buildCurrencyId(TEST_CHAIN_ID, TEST_ADDRESS2)

      const initialState = {
        ...initialPortfolioState,
        tokenBalanceOverrides: {
          [TEST_ADDRESS1]: {
            [currencyId1]: {
              updatedAt: now - 31 * 60 * 1000, // expired
            },
            [currencyId2]: {
              updatedAt: now - 31 * 60 * 1000, // expired
            },
          },
        },
      }

      const state = portfolioReducer(initialState, removeExpiredBalanceOverrides())

      expect(state.tokenBalanceOverrides[TEST_ADDRESS1]).toBeUndefined()
      expect(Object.keys(state.tokenBalanceOverrides)).toHaveLength(0)
    })
  })
})
