import type { SwapSettingsState } from 'uniswap/src/features/transactions/swap/state/slice'
import type { UniswapRootState } from 'uniswap/src/state'

export const selectFilteredChainIds = (state: UniswapRootState): SwapSettingsState['filteredChainIds'] =>
  state.swapSettings.filteredChainIds
