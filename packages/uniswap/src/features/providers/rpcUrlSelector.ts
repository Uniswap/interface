import {
  createRpcUrlSelector,
  DEFAULT_CALLDATA_HINTS_ENABLED,
  DEFAULT_FLASHBOTS_ENABLED,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
} from '@universe/chains'
import { Experiments, getExperimentValue, PrivateRpcProperties } from '@universe/gating'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'

// TODO: migrate consumers to import from @universe/chains directly
export { createRpcUrlSelector } from '@universe/chains'
export type {
  RpcConfig,
  FlashbotsConfig,
  RpcChainInfo,
  ViemChainInfo,
  RpcUrlSelectorCtx,
  RpcUrlSelector,
} from '@universe/chains'

/**
 * Pre-bound selector — wires in the real chain registry and gating experiments.
 * Boundary wiring that stays in uniswap.
 */
export const selectRpcUrl = createRpcUrlSelector({
  getChainInfo,
  getFlashbotsEnabled: () =>
    getExperimentValue({
      experiment: Experiments.PrivateRpc,
      param: PrivateRpcProperties.FlashbotsEnabled,
      defaultValue: DEFAULT_FLASHBOTS_ENABLED,
    }),
  getFlashbotsRefundPercent: () =>
    getExperimentValue({
      experiment: Experiments.PrivateRpc,
      param: PrivateRpcProperties.RefundPercent,
      defaultValue: FLASHBOTS_DEFAULT_REFUND_PERCENT,
    }),
  getCalldataHintsEnabled: () =>
    getExperimentValue({
      experiment: Experiments.PrivateRpc,
      param: PrivateRpcProperties.CalldataHintsEnabled,
      defaultValue: DEFAULT_CALLDATA_HINTS_ENABLED,
    }),
})
