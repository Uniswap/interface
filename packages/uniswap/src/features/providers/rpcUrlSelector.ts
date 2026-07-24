import {
  createRpcUrlSelector,
  DEFAULT_CALLDATA_HINTS_ENABLED,
  DEFAULT_FLASHBOTS_ENABLED,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
} from '@universe/chains'
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
 * Pre-bound selector — wires in the real chain registry and private RPC defaults.
 * Boundary wiring that stays in uniswap.
 */
export const selectRpcUrl = createRpcUrlSelector({
  getChainInfo,
  getFlashbotsEnabled: () => DEFAULT_FLASHBOTS_ENABLED,
  getFlashbotsRefundPercent: () => FLASHBOTS_DEFAULT_REFUND_PERCENT,
  getCalldataHintsEnabled: () => DEFAULT_CALLDATA_HINTS_ENABLED,
})
