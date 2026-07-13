import type { TypedDataDomain as EthersTypedDataDomain } from '@ethersproject/abstract-signer'
import type { JsonRpcSigner } from '@ethersproject/providers'
import { ensure0xHex } from '@universe/encoding'
import {
  type Hex,
  type TypedDataDomain,
  type WalletClient,
  bytesToHex,
  createWalletClient,
  custom,
  getTypesForEIP712Domain,
  hashTypedData,
} from 'viem'
import { type PermitTypes, normalizeTypes, shouldFallbackToEthSign } from './shared'

export type ViemSignTypedDataParams = {
  walletClient: WalletClient
  domain: TypedDataDomain
  types: PermitTypes
  // Match the typical EIP-712 message shape; arbitrary record so
  // callers can pass either pre-typed messages or loosely-typed
  // SDK outputs. Keeping from the original implementation.
  // oxlint-disable-next-line typescript/no-explicit-any
  value: Record<string, any>
  // Caller decides between v4 and v3 based on its own wallet
  // detection. Defaults to `eth_signTypedData_v4` when unspecified.
  method?: 'eth_signTypedData_v4' | 'eth_signTypedData'
  // Invoked once before degrading to `eth_sign`
  // so consumers can log or emit telemetry.
  onFallback?: (error: unknown) => void
  // ENS resolver for `address`-typed fields. viem's `WalletClient`
  // ships no resolver, so case-3 callers wire one up themselves.
  // eg. `(name) => publicClient.getEnsAddress({ name: normalize(name) })`.
  // Omit when SDK-produced typed data already has resolved addresses.
  resolveName?: (name: string) => Promise<string>
}

export type PreparedViemSignTypedData = {
  address: string
  message: string
  viemDomain: TypedDataDomain
  normalizedTypes: Record<string, { name: string; type: string }[]>
  primaryType: string
  populatedValue: Record<string, unknown>
}

/**
 * ethers' `_TypedDataEncoder` derives the primary type internally;
 * viem expects callers to pass it. Find the only struct in `types`
 * not referenced as a child by another struct.
 */
function getPrimaryType(types: Record<string, { name: string; type: string }[]>): string {
  const referenced = new Set<string>()
  for (const fields of Object.values(types)) {
    for (const field of fields) {
      const base = field.type.replace(/\[.*\]$/, '')
      if (types[base]) {
        referenced.add(base)
      }
    }
  }
  const candidates = Object.keys(types).filter((name) => !referenced.has(name))
  if (candidates.length !== 1) {
    throw new Error(`signTypedData: cannot determine primary type (${candidates.length} candidates)`)
  }
  if (typeof candidates[0] !== 'string') {
    throw new Error('Cannot get primaryType, candidate not a string')
  }
  return candidates[0]
}

// JSON shape we ship — chainId is the canonical decimal string and
// verifyingContract is lowercased so wallets see byte-for-byte equivalent
// payloads to ethers' `_TypedDataEncoder.getPayload`.
type PayloadDomain = {
  name?: string
  version?: string
  chainId?: string
  verifyingContract?: string
  salt?: string
}

/**
 * Accepts both ethers (BigNumberish chainId, BytesLike salt) and viem
 * (number/bigint chainId, Hex salt) domain shapes. ethers values flow through
 * verbatim; viem values fit because strict types are structural subsets.
 */
function normalizeDomainForPayload(domain: EthersTypedDataDomain): PayloadDomain {
  const out: PayloadDomain = {}
  if (domain.name !== undefined) {
    out.name = domain.name
  }
  if (domain.version !== undefined) {
    out.version = domain.version
  }
  if (domain.chainId !== undefined) {
    out.chainId = BigInt(String(domain.chainId)).toString()
  }
  if (domain.verifyingContract !== undefined) {
    // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid
    out.verifyingContract = domain.verifyingContract.toLowerCase()
  }
  if (domain.salt !== undefined) {
    out.salt =
      typeof domain.salt === 'string'
        ? domain.salt
        : bytesToHex(domain.salt instanceof Uint8Array ? domain.salt : new Uint8Array(domain.salt))
  }
  return out
}

/**
 * viem's `getTypesForEIP712Domain` and `hashTypedData` detect chainId
 * via `typeof === 'number' || 'bigint'`, so widen the payload's
 * string chainId back to bigint when calling viem helpers.
 */
function toViemDomain(payloadDomain: PayloadDomain): TypedDataDomain {
  const out: TypedDataDomain = {}
  if (payloadDomain.name !== undefined) {
    out.name = payloadDomain.name
  }
  if (payloadDomain.version !== undefined) {
    out.version = payloadDomain.version
  }
  if (payloadDomain.chainId !== undefined) {
    out.chainId = BigInt(payloadDomain.chainId)
  }
  if (payloadDomain.verifyingContract !== undefined) {
    out.verifyingContract = ensure0xHex(payloadDomain.verifyingContract)
  }
  if (payloadDomain.salt !== undefined) {
    out.salt = ensure0xHex(payloadDomain.salt)
  }
  return out
}

/**
 * Walk the typed-data tree and resolve any ENS names appearing in
 * `address` fields, mirroring `_TypedDataEncoder.resolveNames`.
 */
// oxlint-disable-next-line max-params
async function resolveNamesInValue(
  types: Record<string, { name: string; type: string }[]>,
  primaryType: string,
  value: Record<string, unknown>,
  resolve: (name: string) => Promise<string>,
): Promise<Record<string, unknown>> {
  async function resolveStruct(typeName: string, val: Record<string, unknown>): Promise<Record<string, unknown>> {
    const fields = types[typeName]
    if (!fields) {
      return val
    }
    const out: Record<string, unknown> = {}
    for (const field of fields) {
      const fieldVal = val[field.name]
      if (fieldVal === undefined || fieldVal === null) {
        out[field.name] = fieldVal
        continue
      }
      const isArray = field.type.endsWith('[]')
      const base = field.type.replace(/\[.*\]$/, '')
      if (base === 'address') {
        out[field.name] = isArray
          ? await Promise.all(
              (fieldVal as unknown[]).map((v) =>
                typeof v === 'string' && !v.startsWith('0x') ? resolve(v) : Promise.resolve(v),
              ),
            )
          : typeof fieldVal === 'string' && !fieldVal.startsWith('0x')
            ? await resolve(fieldVal)
            : fieldVal
      } else if (types[base]) {
        out[field.name] = isArray
          ? await Promise.all((fieldVal as Record<string, unknown>[]).map((v) => resolveStruct(base, v)))
          : await resolveStruct(base, fieldVal as Record<string, unknown>)
      } else {
        out[field.name] = fieldVal
      }
    }
    return out
  }
  return resolveStruct(primaryType, value)
}

async function resolveNamesInDomain(
  domain: PayloadDomain,
  resolve: (name: string) => Promise<string>,
): Promise<PayloadDomain> {
  if (domain.verifyingContract !== undefined && !domain.verifyingContract.startsWith('0x')) {
    return { ...domain, verifyingContract: (await resolve(domain.verifyingContract)).toLowerCase() }
  }
  return domain
}

/**
 * Wrap an ethers `JsonRpcSigner` in a viem `WalletClient` so the inner
 * viem pipeline only ever sees viem types. The `custom` transport
 * proxies every RPC through `signer.provider.send`, so the wallet
 * receives identical bytes to a direct ethers call.
 */
export async function adaptEthersSignerToWalletClient(signer: JsonRpcSigner): Promise<WalletClient> {
  const address = (await signer.getAddress()).toLowerCase()
  const transport = custom({
    async request({ method, params }) {
      // oxlint-disable-next-line typescript/no-unsafe-return
      return signer.provider.send(method, params ?? [])
    },
  })
  return createWalletClient({
    account: ensure0xHex(address),
    transport,
  })
}

/**
 * Builds the EIP-712 JSON payload and the viem-typed bits the fallback
 * path needs to recompute the hash. Optional `resolveName` callback lets
 * case 2 (ethers signer) keep ENS resolution; case 3 (viem WalletClient)
 * skips it because viem clients don't ship a resolver.
 */
export async function prepareViemSignTypedData({
  walletClient,
  domain,
  types,
  value,
  resolveName,
}: {
  walletClient: WalletClient
  // ethers TypedDataDomain is broader than viem's;
  // accepting it here lets us handle more cases
  domain: EthersTypedDataDomain
  types: PermitTypes
  // Keeping from the original implementation
  // oxlint-disable-next-line typescript/no-explicit-any
  value: Record<string, any>
  resolveName?: (name: string) => Promise<string>
}): Promise<PreparedViemSignTypedData> {
  const normalizedTypes = normalizeTypes(types)
  const primaryType = getPrimaryType(normalizedTypes)
  const resolve = resolveName ?? ((name: string) => Promise.resolve(name))

  const populatedDomain = await resolveNamesInDomain(normalizeDomainForPayload(domain), resolve)
  const populatedValue = await resolveNamesInValue(normalizedTypes, primaryType, value, resolve)

  const viemDomain = toViemDomain(populatedDomain)
  const eip712DomainTypes = getTypesForEIP712Domain({ domain: viemDomain })

  if (!walletClient.account) {
    throw new Error('signTypedData: WalletClient has no account configured')
  }
  // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid
  const address = walletClient.account.address.toLowerCase()
  const message = JSON.stringify({
    domain: populatedDomain,
    types: { EIP712Domain: eip712DomainTypes, ...normalizedTypes },
    primaryType,
    message: populatedValue,
  })

  return {
    address,
    message,
    viemDomain,
    normalizedTypes,
    primaryType,
    populatedValue,
  }
}

/**
 * Sends the prepared payload via `walletClient.request`. On a known
 * "wallet doesn't implement EIP-712" error, calls `onFallback` (if any),
 * computes the EIP-712 hash via `hashTypedData`, and dispatches `eth_sign`.
 */
export async function sendViemSignTypedData({
  walletClient,
  prepared,
  method,
  onFallback,
}: {
  walletClient: WalletClient
  prepared: PreparedViemSignTypedData
  method: 'eth_signTypedData_v4' | 'eth_signTypedData'
  onFallback?: (error: unknown) => void
}): Promise<string> {
  try {
    return await walletClient.request({
      method,
      params: [prepared.address, prepared.message],
    } as Parameters<WalletClient['request']>[0])
  } catch (error) {
    if (shouldFallbackToEthSign(error)) {
      onFallback?.(error)
      const hash: Hex = hashTypedData({
        domain: prepared.viemDomain,
        types: prepared.normalizedTypes,
        primaryType: prepared.primaryType,
        message: prepared.populatedValue,
      })
      return await walletClient.request({
        method: 'eth_sign',
        params: [prepared.address, hash],
      } as Parameters<WalletClient['request']>[0])
    }
    throw error
  }
}
