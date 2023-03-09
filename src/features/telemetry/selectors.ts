import { RootState } from 'src/app/rootReducer'

export const selectLastBalancesReport = (state: RootState): number | undefined =>
  state.telemetry.lastBalancesReport
