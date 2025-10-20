import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { CurrencyId } from 'uniswap/src/types/currency'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { logger } from 'utilities/src/logger/logger'

const OVERRIDE_MAX_AGE = 30 * 60 * 1000 // 30 minutes

export type TokenBalanceOverride = Record<CurrencyId, { updatedAt: number }>

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
    addTokensToBalanceOverride: (state, action: PayloadAction<{ ownerAddress: Address; currencyIds: string[] }>) => {
      const { ownerAddress, currencyIds } = action.payload

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
        }
      })

      state.tokenBalanceOverrides[accountId] = accountOverrides
    },
    removeTokenFromBalanceOverride: (
      state,
      action: PayloadAction<{ ownerAddress: Address; chainId: UniverseChainId; tokenAddress: Address }>,
    ) => {
      const { ownerAddress, chainId, tokenAddress } = action.payload

      const accountId = getValidAddress({ address: ownerAddress, chainId })

      if (!accountId) {
        logger.error(new Error('Unexpected call to `removeTokenFromBalanceOverride` with an invalid address'), {
          tags: { file: 'portfolio/slice/slice.ts', function: 'removeTokenFromBalanceOverride' },
          extra: { ownerAddress, chainId, tokenAddress },
        })
        return
      }

      const currencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(chainId, tokenAddress))

      delete state.tokenBalanceOverrides[accountId]?.[currencyId]

      if (Object.keys(state.tokenBalanceOverrides[accountId] ?? {}).length === 0) {
        delete state.tokenBalanceOverrides[accountId]
      }
    },
    removeExpiredBalanceOverrides: (state) => {
      Object.keys(state.tokenBalanceOverrides).forEach((accountId) => {
        // biome-ignore lint/style/noNonNullAssertion: array access is safe here
        const accountOverrides = state.tokenBalanceOverrides[accountId]!

        const now = Date.now()

        Object.keys(accountOverrides).forEach((currencyId) => {
          // biome-ignore lint/style/noNonNullAssertion: array access is safe here
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
  },
})

export const { addTokensToBalanceOverride, removeTokenFromBalanceOverride, removeExpiredBalanceOverrides } =
  slice.actions

export const portfolioReducer = slice.reducer
