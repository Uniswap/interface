import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ProviderDirectMethods } from 'src/contentScript/methodHandlers/requestMethods'

// Maps read-only JSON-RPC methods to their ethers provider calls. Mirrors the dapp-facing
// surface the injected provider exposes; executed in the background SW so the network fetch
// runs in an extension-privileged context (host_permissions) instead of the dapp's CORS scope.
const methodExecutors: {
  // oxlint-disable-next-line typescript/no-explicit-any -- JSON-RPC params are method-dependent
  [key: string]: (provider: JsonRpcProvider, params: any[]) => Promise<unknown>
} = {
  [ProviderDirectMethods.eth_getBalance]: (provider, params) => provider.getBalance(params[0]),
  [ProviderDirectMethods.eth_getCode]: (provider, params) => provider.getCode(params[0]),
  [ProviderDirectMethods.eth_getStorageAt]: (provider, params) => provider.getStorageAt(params[0], params[1]),
  [ProviderDirectMethods.eth_getTransactionCount]: (provider, params) => provider.getTransactionCount(params[0]),
  [ProviderDirectMethods.eth_blockNumber]: (provider) => provider.getBlockNumber(),
  [ProviderDirectMethods.eth_getBlockByNumber]: (provider, params) => provider.getBlock(params[0]),
  [ProviderDirectMethods.eth_call]: (provider, params) => provider.call(params[0]),
  [ProviderDirectMethods.eth_gasPrice]: (provider) => provider.getGasPrice(),
  [ProviderDirectMethods.eth_estimateGas]: (provider, params) => provider.estimateGas(params[0]),
  [ProviderDirectMethods.eth_getTransactionByHash]: (provider, params) => provider.getTransaction(params[0]),
  [ProviderDirectMethods.eth_getTransactionReceipt]: (provider, params) => provider.getTransactionReceipt(params[0]),
  [ProviderDirectMethods.net_version]: (provider, params) => provider.send('net_version', params),
  [ProviderDirectMethods.web3_clientVersion]: (provider, params) => provider.send('web3_clientVersion', params),
}

export function isProviderDirectExecutableMethod(method: string): boolean {
  return method in methodExecutors
}

function serializeJsonReplacerValue(value: unknown): unknown {
  if (value == null || value === false) {
    return value
  }
  if (BigNumber.isBigNumber(value)) {
    return value.toHexString()
  }
  if (
    typeof value === 'object' &&
    'type' in value &&
    (value as { type: unknown }).type === 'BigNumber' &&
    'hex' in value &&
    typeof (value as { hex: unknown }).hex === 'string'
  ) {
    return (value as { hex: string }).hex
  }
  return value
}

// Normalize ethers BigNumber values to hex strings so the result survives the structured-clone
// message boundary and matches the shape dapps expect (e.g. Morpho rejects BigNumber JSON).
function toJsonSafe(result: unknown): unknown {
  return JSON.parse(JSON.stringify(result, (_key, value: unknown) => serializeJsonReplacerValue(value))) as unknown
}

/**
 * Runs a read-only JSON-RPC method against the background provider and returns a JSON-safe result.
 * Throws for unknown methods (callers gate on isProviderDirectExecutableMethod) and propagates
 * provider errors to the caller for serialization into a JSON-RPC error response.
 */
export async function executeProviderDirectMethod({
  provider,
  method,
  params,
}: {
  provider: JsonRpcProvider
  method: string
  params: unknown[]
}): Promise<unknown> {
  const executor = methodExecutors[method]
  if (!executor) {
    throw new Error(`Unsupported provider-direct method: ${method}`)
  }
  // oxlint-disable-next-line typescript/no-explicit-any -- params validated upstream by the request schema
  const result = await executor(provider, params as any[])
  return toJsonSafe(result)
}
