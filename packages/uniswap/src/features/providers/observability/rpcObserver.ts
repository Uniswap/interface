import { extractProviderName } from 'uniswap/src/features/providers/observability/extractProviderName'
import { logger } from 'utilities/src/logger/logger'

export interface RpcRequestContext {
  requestId: string
  method: string
  params: unknown
  chainId: number
  url: string
  transport: 'viem' | 'ethers'
}

export interface RpcResponseContext extends RpcRequestContext {
  durationMs: number
}

export interface RpcErrorContext extends RpcRequestContext {
  durationMs: number
  error: unknown
  errorCategory?: string
}

export interface RpcObserver {
  onRequest: (ctx: RpcRequestContext) => void
  onResponse: (ctx: RpcResponseContext) => void
  onError: (ctx: RpcErrorContext) => void
}

export const noopObserver: RpcObserver = {
  onRequest: () => {},
  onResponse: () => {},
  onError: () => {},
}

function createDatadogRpcObserver(): RpcObserver {
  return {
    onRequest: (): void => {},
    onResponse: (ctx: RpcResponseContext): void => {
      logger.info('rpcObserver', 'onResponse', 'RPC response', {
        method: ctx.method,
        chainId: ctx.chainId,
        durationMs: Math.round(ctx.durationMs),
        provider: extractProviderName(ctx.url),
        transport: ctx.transport,
      })
    },
    onError: (ctx: RpcErrorContext): void => {
      logger.warn('rpcObserver', 'onError', 'RPC error', {
        method: ctx.method,
        chainId: ctx.chainId,
        durationMs: Math.round(ctx.durationMs),
        provider: extractProviderName(ctx.url),
        transport: ctx.transport,
        error: ctx.error instanceof Error ? ctx.error.message : String(ctx.error),
      })
    },
  }
}

let counter = 0
export function generateRequestId(): string {
  return `rpc-${++counter}`
}

let observer: RpcObserver = createDatadogRpcObserver()

export function getRpcObserver(): RpcObserver {
  return observer
}

export function setRpcObserver(obs: RpcObserver): void {
  observer = obs
}
