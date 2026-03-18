import { createSelector, Selector } from '@reduxjs/toolkit'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { PortfolioState, TokenBalanceOverride } from 'uniswap/src/features/portfolio/slice/slice'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectTokenBalanceOverrides = (state: UniswapState): PortfolioState['tokenBalanceOverrides'] =>
  state.portfolio.tokenBalanceOverrides

export const makeSelectTokenBalanceOverridesForWalletAddress = (): Selector<
  UniswapState,
  undefined | TokenBalanceOverride,
  [Address]
> =>
  createSelector(
    selectTokenBalanceOverrides,
    (_: UniswapState, walletAddress: Address) => walletAddress,
    (tokenBalanceOverrides, walletAddress) => tokenBalanceOverrides[normalizeTokenAddressForCache(walletAddress)],
  )
