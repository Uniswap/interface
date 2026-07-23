import { extractRpcErrorMeta, generateRequestId, getRpcObserver } from '@universe/chains'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { type CreateConnectorFn, createConnector } from 'wagmi'

// WalletConnect connectors serve read RPC calls from `@walletconnect/ethereum-provider`'s
// own in-page HTTP client, bypassing the app's instrumented transports (the INC-304 blind
// spot). Patch the connector's EIP-1193 `request` so read failures reach `getRpcObserver()`.

interface Eip1193RequestArgs {
  method: string
  params?: unknown
}

interface InstrumentableProvider {
  request: (args: Eip1193RequestArgs) => Promise<unknown>
  chainId?: number
}

// Methods routed to the wallet over the relay, not to the default RPC endpoint;
// their failures are user rejections / wallet errors, not RPC infra failures.
const WALLET_RPC_METHODS = new Set<string>([
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_requestAccounts',
  'eth_accounts',
])

const instrumentedProviders = new WeakSet<object>()

function isInstrumentableProvider(value: unknown): value is InstrumentableProvider {
  return typeof value === 'object' && value !== null && typeof (value as InstrumentableProvider).request === 'function'
}

function isWalletRpcMethod(method: string): boolean {
  return WALLET_RPC_METHODS.has(method) || method.startsWith('wallet_')
}

function reportConnectorRpcError(args: {
  method: string
  params?: unknown
  chainId?: number
  durationMs: number
  error: unknown
}): void {
  if (isWalletRpcMethod(args.method)) {
    return
  }

  try {
    const url = isUniverseChainId(args.chainId) ? (getChainInfo(args.chainId).rpcUrls.default.http[0] ?? '') : ''
    getRpcObserver().onError({
      requestId: generateRequestId(),
      method: args.method,
      params: args.params,
      chainId: args.chainId ?? -1,
      url,
      transport: 'wc',
      durationMs: args.durationMs,
      error: args.error,
      ...extractRpcErrorMeta(args.error),
    })
  } catch {
    // Telemetry must never alter connector behavior.
  }
}

function patchProviderRequest(provider: InstrumentableProvider): void {
  if (instrumentedProviders.has(provider)) {
    return
  }
  const original = provider.request.bind(provider)
  provider.request = async (requestArgs: Eip1193RequestArgs): Promise<unknown> => {
    const start = performance.now()
    try {
      return await original(requestArgs)
    } catch (error) {
      reportConnectorRpcError({
        method: requestArgs.method,
        params: requestArgs.params,
        chainId: provider.chainId,
        durationMs: performance.now() - start,
        error,
      })
      throw error
    }
  }
  instrumentedProviders.add(provider)
}

/** Wraps a WalletConnect-protocol connector so its read RPC failures are reported to `getRpcObserver()`. */
export function instrumentWalletConnectRpc(connector: CreateConnectorFn): CreateConnectorFn {
  return createConnector((config) => {
    const base = connector(config)
    return {
      ...base,
      getProvider: (async (params) => {
        const provider = await base.getProvider(params)
        if (isInstrumentableProvider(provider)) {
          patchProviderRequest(provider)
        }
        return provider
      }) as typeof base.getProvider,
    }
  })
}
