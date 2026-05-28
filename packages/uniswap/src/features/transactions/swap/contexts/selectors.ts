import { SwapSettingsState } from 'uniswap/src/features/transactions/swap/contexts/slice'
import { UniswapRootState } from 'uniswap/src/state'

export const selectFilteredChainIds = (state: UniswapRootState): SwapSettingsState['filteredChainIds'] =>
  state.swapSettings.filteredChainIds
