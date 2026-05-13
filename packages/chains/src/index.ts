// Chain types (canonical source of truth)
export { UniverseChainId, RPCType } from './rpc/types'
export type { RpcChainInfo, ViemChainInfo } from './rpc/types'

// RPC config types
export type { RpcConfig, FlashbotsConfig, RpcUrlSelectorCtx, RpcUrlSelector } from './rpc/rpcUrlSelector'
export type { RpcConfigResolver, RpcConfigResolverInput } from './rpc/resolveRpcConfig'
export type { UniRpcConfig } from './rpc/getUniRpcConfig'
export type { CreateEthersProvider } from './rpc/createEthersProvider'
export type { CreateViemClient, CreateViemClientFactoryCtx } from './rpc/createViemClient'
export type { SessionStrategy } from './rpc/createUniRpcTransport'

// Config factories
export { createUniRpcConfigResolver } from './rpc/getUniRpcConfig'
export { createRpcConfigResolver } from './rpc/resolveRpcConfig'
export { createRpcUrlSelector } from './rpc/rpcUrlSelector'

// Provider factories
export { createEthersProviderFactory } from './rpc/createEthersProvider'
export { createViemClientFactory } from './rpc/createViemClient'
export { createUniRpcTransportFactory } from './rpc/createUniRpcTransport'
export { ViemClientManager } from './rpc/ViemClientManager'
// Flashbots
export { FlashbotsRpcProvider } from './rpc/FlashbotsRpcProvider'
export { createFlashbotsRpcClient, createFlashbotsTransport } from './rpc/FlashbotsRpcClient'
export {
  buildFlashbotsUrl,
  waitForFlashbotsProtectReceipt,
  FlashbotsReceiptSchema,
  FLASHBOTS_RPC_URL,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
  FLASHBOTS_SIGNATURE_HEADER,
  DEFAULT_FLASHBOTS_ENABLED,
  DEFAULT_FLASHBOTS_BLOCK_RANGE,
  DEFAULT_CALLDATA_HINTS_ENABLED,
  POLL_INTERVAL_MS,
  MAX_ATTEMPTS,
} from './rpc/FlashbotsCommon'
export type { FlashbotsReceipt, SignerInfo } from './rpc/FlashbotsCommon'

// Utilities
export { createUtilities } from './createUtilities'
export type { Utilities } from './createUtilities'
export { createIsAddress } from './createIsAddress'
export { createNamehash } from './createNamehash'
export { createParseUnits } from './createParseUnits'
export { zeroAddress } from './createZeroAddress'

// Observability
export { InstrumentedJsonRpcProvider } from './rpc/observability/InstrumentedJsonRpcProvider'
export { createObservableTransport } from './rpc/observability/createObservableTransport'
export { extractProviderName } from './rpc/observability/extractProviderName'
export {
  noopObserver,
  generateRequestId,
  getRpcObserver,
  setRpcObserver,
  resetErrorBuckets,
} from './rpc/observability/rpcObserver'
export type {
  RpcRequestContext,
  RpcResponseContext,
  RpcErrorContext,
  RpcObserver,
} from './rpc/observability/rpcObserver'
