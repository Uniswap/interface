import { Selector, createSelector } from '@reduxjs/toolkit'
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
    (tokenBalanceOverrides, walletAddress) => tokenBalanceOverrides[walletAddress.toLowerCase()],
  )
