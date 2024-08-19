import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectSwapStartTimestamp = (state: UniswapState): number | undefined => state.timing.swap.startTimestamp
