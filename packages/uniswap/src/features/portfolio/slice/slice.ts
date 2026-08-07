import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { type CurrencyId } from 'uniswap/src/types/currency'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { logger } from 'utilities/src/logger/logger'

const OVERRIDE_MAX_AGE = 30 * 60 * 1000 // 30 minutes

export type TokenBalanceOverrideGeneration = string
export type ExpectedTokenBalanceOverrideGeneration = TokenBalanceOverrideGeneration | null

export type TokenBalanceOverride = Record<
  CurrencyId,
  {
    updatedAt: number
    // Optional so persisted overrides created before generation tracking remain valid.
    generation?: TokenBalanceOverrideGeneration
  }
>

export type PortfolioState = {
  tokenBalanceOverrides: Record<Address, TokenBalanceOverride>
}

export const initialPortfolioState: PortfolioState = {
  tokenBalanceOverrides: {},
}

const slice = createSlice({
  name: 'portfolio',
  initialState: initialPortfolioState,
  reducers: {
    addTokensToBalanceOverride: {
      reducer: (
        state,
        action: PayloadAction<{
          ownerAddress: Address
          currencyIds: string[]
          generation: TokenBalanceOverrideGeneration
        }>,
      ) => {
        const { ownerAddress, currencyIds, generation } = action.payload

        const accountId = getValidAddress({
          address: ownerAddress,
          platform: isEVMAddressWithChecksum(ownerAddress) ? Platform.EVM : Platform.SVM,
        })

        if (!accountId) {
          logger.error(new Error('Unexpected call to `addTokensToBalanceOverride` with an invalid address'), {
            tags: { file: 'portfolio/slice/slice.ts', function: 'addTokensToBalanceOverride' },
            extra: { ownerAddress, currencyIds },
          })
          return
        }

        const accountOverrides = state.tokenBalanceOverrides[accountId] ?? {}

        const now = new Date().getTime()
        currencyIds.forEach((currencyId) => {
          accountOverrides[currencyId] = {
            updatedAt: now,
            generation,
          }
        })

        state.tokenBalanceOverrides[accountId] = accountOverrides
      },
      prepare: (payload: { ownerAddress: Address; currencyIds: string[] }) => ({
        payload: { ...payload, generation: nanoid() },
      }),
    },
    removeTokenFromBalanceOverride: (
      state,
      action: PayloadAction<{
        ownerAddress: Address
        chainId: UniverseChainId
        tokenAddress: Address
        expectedGeneration?: ExpectedTokenBalanceOverrideGeneration
      }>,
    ) => {
      const { ownerAddress, chainId, tokenAddress, expectedGeneration } = action.payload

      const accountId = getValidAddress({ address: ownerAddress, chainId })

      if (!accountId) {
        logger.error(new Error('Unexpected call to `removeTokenFromBalanceOverride` with an invalid address'), {
          tags: { file: 'portfolio/slice/slice.ts', function: 'removeTokenFromBalanceOverride' },
          extra: { ownerAddress, chainId, tokenAddress },
        })
        return
      }

      const currencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(chainId, tokenAddress))
      const override = state.tokenBalanceOverrides[accountId]?.[currencyId]

      if (expectedGeneration !== undefined && (override?.generation ?? null) !== expectedGeneration) {
        return
      }

      delete state.tokenBalanceOverrides[accountId]?.[currencyId]

      if (Object.keys(state.tokenBalanceOverrides[accountId] ?? {}).length === 0) {
        delete state.tokenBalanceOverrides[accountId]
      }
    },
    removeExpiredBalanceOverrides: (state) => {
      Object.keys(state.tokenBalanceOverrides).forEach((accountId) => {
        // oxlint-disable-next-line typescript/no-non-null-assertion -- array access is safe here
        const accountOverrides = state.tokenBalanceOverrides[accountId]!

        const now = Date.now()

        Object.keys(accountOverrides).forEach((currencyId) => {
          // oxlint-disable-next-line typescript/no-non-null-assertion -- array access is safe here
          if (now - accountOverrides[currencyId]!.updatedAt > OVERRIDE_MAX_AGE) {
            logger.warn(
              'portfolio/slice/slice.ts',
              'removeExpiredBalanceOverrides',
              `[ITBU] Removing expired token balance override for ${accountId}: ${currencyId}`,
            )

            delete accountOverrides[currencyId]
          }
        })

        // If the account has no overrides left, remove the account entry.
        if (Object.keys(accountOverrides).length === 0) {
          delete state.tokenBalanceOverrides[accountId]
        }
      })
    },
    resetPortfolio: () => initialPortfolioState,
  },
})

export const {
  addTokensToBalanceOverride,
  removeTokenFromBalanceOverride,
  removeExpiredBalanceOverrides,
  resetPortfolio,
} = slice.actions

export const portfolioReducer = slice.reducer
