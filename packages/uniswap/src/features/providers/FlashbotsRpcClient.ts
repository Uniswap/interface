import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  buildFlashbotsUrl,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
  FLASHBOTS_SIGNATURE_HEADER,
  SignerInfo,
} from 'uniswap/src/features/providers/FlashbotsCommon'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import {
  Chain,
  ClientConfig,
  createPublicClient,
  EIP1193RequestFn,
  hashMessage,
  http,
  PublicClient,
  Transport,
  TransportConfig,
  walletActions,
} from 'viem'

/**
 * Creates a Flashbots RPC client using viem
 * This is the viem equivalent of FlashbotsRpcProvider for ethers
 */
export function createFlashbotsRpcClient({
  chain,
  signerInfo,
  refundPercent = FLASHBOTS_DEFAULT_REFUND_PERCENT,
}: {
  chain: Chain
  signerInfo?: SignerInfo
  refundPercent?: number
}): PublicClient {
  // Build complete URL with all parameters
  const url = buildFlashbotsUrl({
    address: signerInfo?.address,
    refundPercent,
  })

  // Create transport with the configured URL
  const transport = createFlashbotsTransport({
    url,
    signerInfo,
  })

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
  url,
}: {
  signerInfo?: SignerInfo
  refundPercent?: number
  url?: string
}): Transport {
  // Build URL if not provided
  const baseUrl =
    url ||
    buildFlashbotsUrl({
      address: signerInfo?.address,
      refundPercent,
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
      if (!signerInfo || !shouldAuthenticateRequest({ method, params, signerAddress: signerInfo.address })) {
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
}: {
  method: string
  params: unknown
  signerAddress?: string
}): boolean {
  return (
    method === 'eth_getTransactionCount' &&
    Array.isArray(params) &&
    params[1] === 'pending' &&
    !!signerAddress &&
    typeof params[0] === 'string' &&
    areAddressesEqual({
      addressInput1: { address: params[0], platform: Platform.EVM },
      addressInput2: { address: signerAddress, platform: Platform.EVM },
    })
  )
}

/**
 * Creates authentication headers for Flashbots requests
 */
async function createAuthHeaders(requestBody: string, signerInfo: SignerInfo): Promise<Record<string, string>> {
  const messageHash = hashMessage(requestBody)
  const signature = await signerInfo.signer.signMessage(messageHash)
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
