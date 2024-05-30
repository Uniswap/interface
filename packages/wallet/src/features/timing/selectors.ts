import { SharedState } from 'wallet/src/state/reducer'

export const selectSwapStartTimestamp = (state: SharedState): number | undefined =>
  state.timing.swap.startTimestamp
