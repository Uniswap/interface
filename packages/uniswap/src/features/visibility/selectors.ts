import { PositionKeyToVisibility } from 'uniswap/src/features/visibility/slice'
import { UniswapRootState } from 'uniswap/src/state'

export const selectPositionsVisibility = (state: UniswapRootState): PositionKeyToVisibility =>
  state.visibility.positions || {}
