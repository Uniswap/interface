import { TradingApi } from '@universe/api'
import { ensure0xHex, HexString, isValidHexString } from '@universe/encoding'
import { providers, utils } from 'ethers'
import { logger } from 'utilities/src/logger/logger'
import {
  Address,
  numberToHex,
  pad,
  parseSignature,
  SignedAuthorization,
  serializeTransaction,
  TransactionSerializable,
  TransactionSerializableEIP7702,
} from 'viem'
import { hashAuthorization, recoverAuthorizationAddress, verifyAuthorization } from 'viem/utils'
import { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'

/**
 * Which code path produced an EIP-7702 authorization, for the SWAP-2471 auth-nonce telemetry.
 */
export enum AuthorizationNoncePath {
  BundledDelegation = 'bundled-delegation',
  UserOp4337 = '4337',
}

/**
 * Converts an ethers TransactionRequest to a Viem EIP-7702 transaction
 * @param ethersTx - The ethers TransactionRequest to convert
 * @param walletAddress - The wallet address for the transaction
 * @param signedAuthorization - Optional signed authorization for delegation
 * @returns - A TransactionSerializableEIP7702 object for viem
 */
export function convertToEIP7702({
  ethersTx,
  walletAddress,
  signedAuthorization,
}: {
  ethersTx: providers.TransactionRequest
  walletAddress: Address
  signedAuthorization: SignedAuthorization
}): TransactionSerializableEIP7702 {
  if (ethersTx.to !== ethersTx.from) {
    throw new Error('Smart wallet transactions must already be encoded and have matching to/from addresses')
  }

  const data = ethersTx.data
  if (!data || typeof data !== 'string' || (data !== '0x' && !isValidHexString(data))) {
    throw new Error(`Invalid data value: ${data}`)
  }

  const serializableTx: TransactionSerializableEIP7702 = {
    // Standard transaction fields
    to: walletAddress,
    value: ethersTx.value ? BigInt(ethersTx.value.toString()) : BigInt(0),
    data,
    nonce: ethersTx.nonce ? Number(ethersTx.nonce) : 0,
    chainId: Number(ethersTx.chainId),

    // Gas fields
    maxFeePerGas: ethersTx.maxFeePerGas ? BigInt(ethersTx.maxFeePerGas.toString()) : BigInt(0),
    maxPriorityFeePerGas: ethersTx.maxPriorityFeePerGas ? BigInt(ethersTx.maxPriorityFeePerGas.toString()) : BigInt(0),
    gas: ethersTx.gasLimit ? BigInt(ethersTx.gasLimit.toString()) : BigInt(0),

    // EIP-7702 specific fields
    authorizationList: [signedAuthorization],
    type: 'eip7702',
  }

  return serializableTx
}

/**
 * Signs and serializes an EIP-7702 transaction
 * @param signer
 * @param tx - The viem transaction to sign and serialize
 * @param address - The address to sign with
 * @param chainId - The chain ID for the transaction
 * @returns - The serialized transaction with signature
 */
export async function signAndSerializeEIP7702Transaction({
  signer,
  tx,
  address,
  chainId,
}: {
  signer: NativeSigner
  tx: TransactionSerializable
  address: string
  chainId: number
}): Promise<HexString> {
  // Serialize the transaction using viem
  const serializedTx = serializeTransaction(tx)

  // Hash the transaction
  const hashedTx = utils.keccak256(serializedTx)

  // Sign the transaction hash
  const transactionSignature: string = await signer.signHashForAddress(address, hashedTx, chainId)

  // Ensure the signature has 0x prefix
  const transactionSignatureHex = ensure0xHex(transactionSignature)

  // Parse the signature
  const parsedTxSignature = parseSignature(transactionSignatureHex)

  // Serialize the transaction with the signature
  return serializeTransaction(tx, {
    r: parsedTxSignature.r,
    s: parsedTxSignature.s,
    yParity: parsedTxSignature.yParity,
  })
}

/**
 * Creates a signed authorization for delegation
 * @param signer - The signer to use for signing
 * @param walletAddress - The wallet address to create delegation for
 * @param chainId - The chain ID for the delegation
 * @param contractAddress - The delegation contract address
 * @param nonce - The nonce to use for the authorization
 * @returns - The signed authorization
 */
export async function createSignedAuthorization({
  signer,
  walletAddress,
  chainId,
  contractAddress,
  nonce,
}: {
  signer: NativeSigner
  walletAddress: Address
  chainId: number
  contractAddress: Address
  nonce: number
}): Promise<SignedAuthorization> {
  try {
    const authorizationHash: HexString = hashAuthorization({
      chainId,
      contractAddress,
      nonce,
    })

    const signedAuthorizationMessage: string = await signer.signHashForAddress(
      walletAddress,
      utils.arrayify(authorizationHash),
      chainId,
    )

    // Reconstruct authorization from signature
    let signedAuthorization = reconstructAuthorization({
      chainId,
      contractAddress,
      nonce,
      signature: signedAuthorizationMessage,
    })

    // Pad r/s to a full 32 bytes. ECDSA r/s are 256-bit integers; when the high
    // byte is zero, a minimal-hex encoding yields a short (odd-length) value that
    // strict RPCs reject with "value length was not even".
    const r = padHexTo32Bytes(signedAuthorization.r)
    const s = padHexTo32Bytes(signedAuthorization.s)

    signedAuthorization = {
      ...signedAuthorization,
      r,
      s,
    }

    if (!isValidHexString(signedAuthorizationMessage)) {
      throw new Error(`Invalid signed authorization message: ${signedAuthorizationMessage}`)
    }

    // Verify the authorization
    const recoveredAddress = await recoverAuthorizationAddress({
      authorization: signedAuthorization,
      signature: signedAuthorizationMessage,
    })

    const signedAuthorizationValid = await verifyAuthorization({
      address: walletAddress,
      authorization: signedAuthorization,
    })

    if (!signedAuthorizationValid) {
      throw new Error('Invalid authorization object')
    }

    if (recoveredAddress !== walletAddress) {
      throw new Error('Invalid authorization address')
    }

    return signedAuthorization
  } catch (error) {
    logger.error(error, {
      tags: { file: 'eip7702Utils', function: 'createSignedAuthorization' },
    })
    throw error
  }
}

// Left-pads a signature component hex string to a full 32 bytes (64 hex chars).
// EIP-7702 auth r/s must be byte-aligned 32-byte values; a stripped leading zero
// produces an odd-length value that strict RPCs reject ("value length was not even").
function padHexTo32Bytes(hexValue: HexString): HexString {
  return pad(ensure0xHex(hexValue), { size: 32 })
}

/**
 * Reconstructs a signed authorization from its components
 * @param chainId - The chain ID for the authorization
 * @param contractAddress - The delegation contract address
 * @param nonce - The nonce for the authorization tuple
 * @param signature - The signature of the authorization
 * @returns - The reconstructed SignedAuthorization
 */
function reconstructAuthorization({
  chainId,
  contractAddress,
  nonce,
  signature,
}: {
  chainId: number
  contractAddress: HexString
  nonce: number
  signature: string
}): SignedAuthorization {
  try {
    // ensure it starts with 0x and is 132 characters long
    if (!signature.startsWith('0x') || signature.length !== 132) {
      throw new Error('Invalid signature format')
    }

    if (!isValidHexString(signature)) {
      throw new Error(`Invalid signature: ${signature}`)
    }

    const parsedSignature = parseSignature(signature)
    const signedAuthorization: SignedAuthorization = {
      address: contractAddress,
      chainId,
      nonce,
      ...parsedSignature,
    }
    return signedAuthorization
  } catch (error) {
    logger.error(error, {
      tags: { file: 'eip7702Utils', function: 'reconstructAuthorization' },
    })
    throw error
  }
}

/**
 * Converts a viem `SignedAuthorization` into the Trading API `Eip7702Authorization`
 * wire shape (hex-encoded chainId/nonce/yParity), suitable for embedding in
 * `Swap4337Request` / `Encode4337Request` / `CheckApproval4337Request`.
 */
export function toTradingApiEip7702Auth(auth: SignedAuthorization): TradingApi.Eip7702Authorization {
  return {
    address: auth.address,
    chainId: numberToHex(auth.chainId),
    nonce: numberToHex(auth.nonce),
    r: auth.r,
    s: auth.s,
    yParity: numberToHex(auth.yParity ?? 0),
  }
}

/**
 * Signs a fresh EIP-7702 delegation authorization for `walletAddress` using the EOA's
 * *pending* transaction nonce, returned in Trading API wire format.
 *
 * Attach this to a 4337 request (swap/encode/approval) BEFORE the backend's paymaster +
 * bundler simulation: an undelegated account is then simulated as delegated,
 * so a first sponsored swap/approval gets correct sponsorship + gas estimates. The signed
 * auth round-trips back on the returned UserOp, so the later `signUserOp` step reuses it.
 *
 * Returns `undefined` when no `contractAddress` is provided (nothing to delegate to).
 */
export async function prepareDelegationAuthorization({
  signer,
  provider,
  walletAddress,
  chainId,
  contractAddress,
}: {
  signer: NativeSigner
  provider: providers.Provider
  walletAddress: string
  chainId: number
  contractAddress?: string
}): Promise<TradingApi.Eip7702Authorization | undefined> {
  if (!contractAddress) {
    return undefined
  }

  // EOA transaction nonce (distinct from the 4337 UserOp nonce). `pending` accounts for
  // any in-flight EOA tx; a race between this read and bundler submission can still
  // invalidate the auth.
  const nonce = await provider.getTransactionCount(walletAddress, 'pending')

  // SWAP-2471: the 4337/sponsored path uses the pending count directly as the auth nonce (no +1,
  // unlike the bundled-delegation signer). Log it to compare against the bundled path in prod.
  logger.info('eip7702Utils', 'prepareDelegationAuthorization', '7702 auth nonce', {
    pendingNonceUsedForAuth: nonce,
    chainId,
    contractAddress,
    walletAddress,
    path: AuthorizationNoncePath.UserOp4337,
  })

  const signedAuthorization = await createSignedAuthorization({
    signer,
    walletAddress: walletAddress as Address,
    chainId,
    contractAddress: contractAddress as Address,
    nonce,
  })

  return toTradingApiEip7702Auth(signedAuthorization)
}
