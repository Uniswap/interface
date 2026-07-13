import { TradingApi } from '@universe/api'
import { isValidHexString, numberToHex, parseHex } from '@universe/encoding'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { signTypedDataWithPasskey } from 'uniswap/src/features/passkey/embeddedWallet'
import { checkEmbeddedWalletDelegation } from 'uniswap/src/features/passkey/embeddedWalletDelegation'
import { sign7702AuthorizationWithPasskey } from 'uniswap/src/features/passkey/signing'
import { buildPackedUserOpTypedData } from 'uniswap/src/features/smartWallet/userOp/buildUserOpTypedData'
import { encodeCaliburUserOpSignature } from 'uniswap/src/features/smartWallet/userOp/caliburSignature'
import {
  getTypesForEIP712Domain,
  hashTypedData,
  type Hex,
  pad,
  type PublicClient,
  type SignedAuthorization,
  type TypedDataDomain,
} from 'viem'
import { formatUserOperationRequest, type RpcUserOperation } from 'viem/account-abstraction'
import type { Address } from '~/chains'
import { assume0xAddress } from '~/utils/wagmi'

/**
 * Sign an ERC-4337 PackedUserOperation for the embedded wallet on this device.
 *
 * The flow mirrors the mnemonic UserOp signer in the wallet package. The
 * EIP-712 step routes through Privy's `eth_signTypedData_v4` RPC (via
 * `signTypedDataWithPasskey`): Privy hashes the PackedUserOperation typed data
 * and ECDSA-signs the digest, which is byte-identical to raw-signing
 * `hashTypedData(typedData)` ourselves (`eth_signTypedData_v4(td)` ≡
 * `secp256k1_sign(hashTypedData(td))` for the same key). We use typed-data
 * signing rather than raw `secp256k1_sign` because `eth_signTypedData_v4` is
 * already permitted by the NECK session policy — raw signing is not yet a
 * supported Privy policy method. The on-chain output is unchanged: same EIP-712
 * digest, same Calibur signature envelope.
 *
 * Steps:
 *  1. Build the EIP-712 PackedUserOperation typed data via viem.
 *  2. Ask the passkey-backed Privy session to sign that typed data.
 *  3. Wrap the 65-byte ECDSA result in the Calibur envelope.
 *  4. If the UserOp didn't already carry an EIP-7702 authorization and the
 *     wallet still needs delegation, sign one via `sign7702AuthorizationWithPasskey`
 *     and attach it.
 */
export async function signUserOpWithEmbeddedWallet({
  rpcUserOp,
  address,
  chainId,
  walletId,
  publicClient,
}: {
  rpcUserOp: RpcUserOperation<'0.8'>
  address: Address
  chainId: UniverseChainId
  walletId: string
  publicClient: PublicClient
}): Promise<RpcUserOperation<'0.8'>> {
  // Step 1: EIP-712 PackedUserOperation typed data. NOTE: `formatUserOperation`
  // drops `eip7702Auth`; we preserve it via `rpcUserOp.eip7702Auth` below.
  const typedData = buildUserOpTypedData(rpcUserOp, chainId)

  // Step 2: passkey-backed eth_signTypedData_v4 over the typed data. Privy
  // computes hashTypedData(typedData) internally and returns a bare 65-byte
  // ECDSA signature — the same bytes a raw sign over the digest would produce.
  const passkeySignature = await signTypedDataWithPasskey(serializeTypedData(typedData), walletId)
  if (!passkeySignature || !isValidHexString(passkeySignature)) {
    throw new Error('Embedded wallet returned no UserOp signature')
  }

  // Step 3: Calibur wrap — abi.encode(ROOT_KEY_HASH=bytes32(0), sig, hookData='0x').
  const encodedUserOpSignature = encodeCaliburUserOpSignature(parseHex(passkeySignature))

  // Step 4: attach 7702 authorization if one isn't already bundled by the caller.
  const eip7702Auth =
    rpcUserOp.eip7702Auth ?? (await maybeSign7702Authorization({ address, chainId, walletId, publicClient }))

  return { ...rpcUserOp, signature: encodedUserOpSignature, ...(eip7702Auth ? { eip7702Auth } : {}) }
}

interface UserOpTypedData {
  domain: TypedDataDomain
  types: Record<string, { name: string; type: string }[]>
  primaryType: 'PackedUserOperation'
  message: Record<string, unknown>
}

type Eip712Field = { name: string; type: string }

function packedUserOpDigest({
  domain,
  types,
  message,
}: {
  domain: TypedDataDomain
  types: Eip712Field[]
  message: unknown
}): Hex {
  return hashTypedData({
    domain,
    types: { PackedUserOperation: types },
    primaryType: 'PackedUserOperation',
    message,
  } as Parameters<typeof hashTypedData>[0])
}

function buildUserOpTypedData(rpcUserOp: RpcUserOperation<'0.8'>, chainId: number): UserOpTypedData {
  const { domain, packedUserOperationFields, message } = buildPackedUserOpTypedData(rpcUserOp, chainId)
  // `eth_signTypedData_v4` requires the `EIP712Domain` type declared explicitly (viem's
  // `hashTypedData` derives it implicitly). `getTypesForEIP712Domain` builds it from the
  // present domain fields, so the domain separator Privy computes matches ours.
  const eip712Domain = getTypesForEIP712Domain({ domain })

  const eip712: UserOpTypedData = {
    domain,
    types: { EIP712Domain: eip712Domain, PackedUserOperation: packedUserOperationFields },
    primaryType: 'PackedUserOperation',
    message,
  }

  // Safety: the payload we send must hash to the canonical PackedUserOperation
  // digest the account verifies against. Serializing stringifies bigint uint256
  // fields; re-derive the digest from the serialized-then-reparsed payload (the
  // exact shape Privy receives) and compare. A mismatch means serialization
  // changed the digest — fail loudly before producing an invalid signature.
  const canonicalDigest = packedUserOpDigest({ domain, types: packedUserOperationFields, message })
  const reparsed = JSON.parse(serializeTypedData(eip712)) as UserOpTypedData
  const serializedDigest = packedUserOpDigest({
    domain: reparsed.domain,
    types: reparsed.types.PackedUserOperation,
    message: reparsed.message,
  })
  if (serializedDigest !== canonicalDigest) {
    throw new Error(`UserOp typed-data serialization changed the digest: ${serializedDigest} !== ${canonicalDigest}`)
  }

  return eip712
}

function serializeTypedData(typedData: UserOpTypedData): string {
  return JSON.stringify(typedData, (_key, value: unknown) => (typeof value === 'bigint' ? value.toString() : value))
}

type DelegationAuthParams = {
  address: Address
  chainId: UniverseChainId
  walletId?: string
  publicClient: PublicClient
}

/**
 * Shared core for the EIP-7702 delegation signers: if the wallet needs
 * delegation to Calibur on this chain, sign a fresh authorization with the
 * passkey. Returns undefined when no delegation is needed (already delegated,
 * or chain not delegation-eligible). Callers format the signed authorization
 * into the shape they need.
 */
async function signDelegationAuthorization({
  address,
  chainId,
  walletId,
  publicClient,
}: DelegationAuthParams): Promise<Awaited<ReturnType<typeof sign7702AuthorizationWithPasskey>> | undefined> {
  const delegationResult = await checkEmbeddedWalletDelegation(address, chainId)
  if (!delegationResult?.needsDelegation || !delegationResult.contractAddress) {
    return undefined
  }
  const authorizationNonce = await publicClient.getTransactionCount({ address })
  const authResult = await sign7702AuthorizationWithPasskey({
    contractAddress: delegationResult.contractAddress,
    chainId,
    nonce: authorizationNonce,
    walletId,
  })
  // Pad r/s to a full 32 bytes. ECDSA r/s are 256-bit integers; when the high
  // byte is zero, a minimal-hex encoding from the signer yields a short
  // (odd-length) value that strict RPCs reject ("value length was not even").
  return {
    ...authResult,
    r: pad(parseHex(authResult.r), { size: 32 }),
    s: pad(parseHex(authResult.s), { size: 32 }),
  }
}

/**
 * Sign a fresh EIP-7702 delegation authorization for in-place attachment to a
 * UserOp, formatted as the viem `eip7702Auth`. Returns undefined when no
 * delegation is needed (already delegated, or chain not delegation-eligible).
 */
async function maybeSign7702Authorization(
  params: DelegationAuthParams,
): Promise<RpcUserOperation<'0.8'>['eip7702Auth']> {
  const passkeyAuth = await signDelegationAuthorization(params)
  if (!passkeyAuth) {
    return undefined
  }
  const signedAuthorization: SignedAuthorization = {
    address: assume0xAddress(passkeyAuth.contractAddress),
    chainId: passkeyAuth.chainId,
    nonce: passkeyAuth.nonce,
    r: passkeyAuth.r as Hex,
    s: passkeyAuth.s as Hex,
    yParity: passkeyAuth.yParity,
  }
  return formatUserOperationRequest({ authorization: signedAuthorization }).eip7702Auth
}

/**
 * For a sponsored first swap on an undelegated embedded wallet, sign the EIP-7702
 * delegation authorization UP FRONT so the caller can bundle it into the
 * `encode_4337` request — letting the paymaster and bundler simulate the account
 * as already delegated (SWAP-2460). Returns undefined when no delegation is
 * needed (already delegated, or chain not delegation-eligible).
 *
 * Mirrors {@link maybeSign7702Authorization}, but returns the Trading API
 * `Eip7702Authorization` shape (hex-encoded fields) that the encode request
 * expects, rather than the viem RpcAuthorization used for the in-place attach.
 */
export async function prepareDelegationAuthorization(
  params: DelegationAuthParams,
): Promise<TradingApi.Eip7702Authorization | undefined> {
  const passkeyAuth = await signDelegationAuthorization(params)
  if (!passkeyAuth) {
    return undefined
  }
  return {
    address: passkeyAuth.contractAddress,
    chainId: numberToHex(passkeyAuth.chainId),
    nonce: numberToHex(passkeyAuth.nonce),
    r: passkeyAuth.r,
    s: passkeyAuth.s,
    yParity: numberToHex(passkeyAuth.yParity),
  }
}
