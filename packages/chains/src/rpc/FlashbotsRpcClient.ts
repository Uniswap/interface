import { id } from '@ethersproject/hash'
import {
  Chain,
  ClientConfig,
  createPublicClient,
  EIP1193RequestFn,
  http,
  PublicClient,
  Transport,
  TransportConfig,
  walletActions,
} from 'viem'
import {
  buildFlashbotsUrl,
  DEFAULT_CALLDATA_HINTS_ENABLED,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
  FLASHBOTS_SIGNATURE_HEADER,
  SignerInfo,
} from './FlashbotsCommon'
import { createObservableTransport } from './observability/createObservableTransport'
import type { RpcObserver } from './observability/rpcObserver'

/**
 * Creates a Flashbots RPC client using viem.
 * This is the viem equivalent of FlashbotsRpcProvider for ethers.
 *
 * If an observer is provided, the underlying transport is wrapped with
 * `createObservableTransport` so Flashbots requests emit the same RPC
 * telemetry as non-Flashbots paths.
 */
export function createFlashbotsRpcClient({
  chain,
  signerInfo,
  refundPercent = FLASHBOTS_DEFAULT_REFUND_PERCENT,
  calldataHintsEnabled = DEFAULT_CALLDATA_HINTS_ENABLED,
  areAddressesEqual,
  observer,
}: {
  chain: Chain
  signerInfo?: SignerInfo
  refundPercent?: number
  calldataHintsEnabled?: boolean
  areAddressesEqual: (a: string, b: string) => boolean
  observer?: RpcObserver
}): PublicClient {
  // Build complete URL with all parameters
  const url = buildFlashbotsUrl({
    address: signerInfo?.address,
    refundPercent,
    calldataHintsEnabled,
  })

  // Create transport with the configured URL
  const baseTransport = createFlashbotsTransport({
    url,
    signerInfo,
    areAddressesEqual,
  })

  // Wrap with observability if an observer was provided so Flashbots requests
  // are visible alongside legacy/UniRPC traffic.
  const transport = observer
    ? createObservableTransport({
        baseTransportFactory: baseTransport,
        observer,
        meta: { chainId: chain.id, url },
      })
    : baseTransport

  // Create and return the client
  return createPublicClient({
    chain,
    transport,
  }).extend(walletActions)
}

/**
 * Creates a custom transport that adds Flashbots authentication headers to HTTP requests
 * when needed for specific methods like eth_getTransactionCount with 'pending' block.
 */
export function createFlashbotsTransport({
  signerInfo,
  refundPercent = FLASHBOTS_DEFAULT_REFUND_PERCENT,
  calldataHintsEnabled = DEFAULT_CALLDATA_HINTS_ENABLED,
  url,
  areAddressesEqual,
}: {
  signerInfo?: SignerInfo
  refundPercent?: number
  calldataHintsEnabled?: boolean
  url?: string
  areAddressesEqual: (a: string, b: string) => boolean
}): Transport {
  // Build URL if not provided
  const baseUrl =
    url ||
    buildFlashbotsUrl({
      address: signerInfo?.address,
      refundPercent,
      calldataHintsEnabled,
    })

  // Request ID generator
  let nextId = 1
  const getNextId = (): number => nextId++

  return <chain extends Chain | undefined = Chain>(config: {
    chain?: chain
    pollingInterval?: ClientConfig['pollingInterval']
    retryCount?: TransportConfig['retryCount']
    timeout?: TransportConfig['timeout']
  }) => {
    // Create the base transport
    const baseTransport = http(baseUrl)(config)

    // Request handler with conditional authentication
    const request: EIP1193RequestFn = async ({ method, params }) => {
      // Normal request path - most requests go here
      if (
        !signerInfo ||
        !shouldAuthenticateRequest({ method, params, signerAddress: signerInfo.address, areAddressesEqual })
      ) {
        return baseTransport.request({ method, params })
      }

      // Authentication needed - special handling path
      const requestBody = formatJsonRpcRequest({ method, params, getId: getNextId })
      const headers = await createAuthHeaders(requestBody, signerInfo)

      // Create a one-time authenticated transport
      const authTransport = http(baseUrl, {
        fetchOptions: { headers },
      })(config)

      return authTransport.request({ method, params })
    }

    return {
      ...baseTransport,
      config: {
        ...baseTransport.config,
        type: 'flashbots',
      },
      request,
      value: undefined,
    }
  }
}

// --- Utility Functions ---

/**
 * Determines if a request should be authenticated with Flashbots headers
 */
function shouldAuthenticateRequest({
  method,
  params,
  signerAddress,
  areAddressesEqual,
}: {
  method: string
  params: unknown
  signerAddress?: string
  areAddressesEqual: (a: string, b: string) => boolean
}): boolean {
  return (
    method === 'eth_getTransactionCount' &&
    Array.isArray(params) &&
    params[1] === 'pending' &&
    !!signerAddress &&
    typeof params[0] === 'string' &&
    areAddressesEqual(params[0], signerAddress)
  )
}

/**
 * Creates authentication headers for Flashbots requests.
 *
 * Flashbots expects the signature to be over `keccak256(body)` treated as a
 * UTF-8 string (ethers' `signMessage` wraps it in the personal-message prefix
 * once). `id()` from @ethersproject/hash returns that raw keccak256 hex.
 *
 * Using `hashMessage()` here would be a bug: it applies the personal-message
 * prefix itself, and then `signer.signMessage()` applies it again, producing
 * a signature over the wrong hash that Flashbots rejects. This matches the
 * FlashbotsRpcProvider (ethers) path which also uses `id()`.
 */
async function createAuthHeaders(requestBody: string, signerInfo: SignerInfo): Promise<Record<string, string>> {
  const signature = await signerInfo.signer.signMessage(id(requestBody))
  return { [FLASHBOTS_SIGNATURE_HEADER]: `${signerInfo.address}:${signature}` }
}

/**
 * Formats a JSON-RPC request with the next request ID
 */
function formatJsonRpcRequest({
  method,
  params,
  getId,
}: {
  method: string
  params: unknown
  getId: () => number
}): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    method,
    params,
    id: getId(),
  })
}
