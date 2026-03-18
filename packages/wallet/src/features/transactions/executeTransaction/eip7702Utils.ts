import { providers, utils } from 'ethers'
import { ensure0xHex, HexString, isValidHexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import {
  Address,
  parseSignature,
  SignedAuthorization,
  serializeTransaction,
  TransactionSerializable,
  TransactionSerializableEIP7702,
} from 'viem'
import { hashAuthorization, recoverAuthorizationAddress, verifyAuthorization } from 'viem/utils'
import { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'

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

    // normalize values if needed
    const r = normalizeHexValue(signedAuthorization.r)
    const s = normalizeHexValue(signedAuthorization.s)

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

// Function to normalize hex strings by removing leading zeros
function normalizeHexValue(hexValue: HexString): HexString {
  // Check if it's a hex string with 0x prefix
  if (!hexValue.startsWith('0x')) {
    return hexValue
  }
  // Remove 0x prefix, remove leading zeros, and add prefix back
  const withoutPrefix = hexValue.slice(2)
  const normalized = withoutPrefix.replace(/^0+/, '')
  // If the result is an empty string (all zeros), return '0x0'
  if (normalized === '') {
    return '0x0'
  }
  return `0x${normalized}`
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
