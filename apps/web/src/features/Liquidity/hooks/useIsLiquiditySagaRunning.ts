import { SagaStatus, useMonitoredSagaStatus } from 'uniswap/src/utils/saga'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'

/**
 * True for the whole lifetime of a liquidity saga run (chain switch, approvals, pending wallet
 * signatures), independent of any modal's local step state. The saga runs one flow at a time and
 * drops triggers while busy, so every LP confirm must stay disabled until this is false.
 */
export function useIsLiquiditySagaRunning(): boolean {
  return useMonitoredSagaStatus(liquiditySaga.name).status === SagaStatus.Started
}
