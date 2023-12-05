import { MobileState } from 'src/app/reducer'

export const selectSwapStartTimestamp = (state: MobileState): number | undefined =>
  state.timing.swap.startTimestamp
