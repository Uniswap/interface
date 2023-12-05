// If the message to be signed is a hex string, it must be converted to an array:

import { ethers, TypedDataDomain, TypedDataField, Wallet } from 'ethers'
import { arrayify, isHexString } from 'ethers/lib/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'
import { EthTypedMessage } from 'wallet/src/features/wallet/signing/types'
import { ensureLeading0x } from 'wallet/src/utils/addresses'
import { SignerManager } from './SignerManager'

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage(
  message: string,
  account: Account,
  signerManager: SignerManager,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> {
  // Mobile code does not explicitly connect to provider,
  // Web needs to connect to provider to ensure correct chain
  const unconnectedSigner = await signerManager.getSignerForAccount(account)
  const signer = provider ? unconnectedSigner?.connect(provider) : unconnectedSigner
  const formattedMessage = isHexString(message) ? arrayify(message) : message
  const signature = await signer.signMessage(formattedMessage)
  return ensureLeading0x(signature)
}

export async function signTypedData(
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  value: Record<string, unknown>,
  account: Account,
  signerManager: SignerManager,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> {
  // Mobile code does not explicitly connect to provider,
  // Web needs to connect to provider to ensure correct chain
  const unconnectedSigner = await signerManager.getSignerForAccount(account)
  const signer = provider ? unconnectedSigner?.connect(provider) : unconnectedSigner

  // https://github.com/LedgerHQ/ledgerjs/issues/86
  // Ledger does not support signTypedData yet
  if (!(signer instanceof NativeSigner) && !(signer instanceof Wallet)) {
    throw new Error('Incompatible account for signing typed data')
  }

  const signature = await signer._signTypedData(domain, types, value)
  return ensureLeading0x(signature)
}

export async function signTypedDataMessage(
  message: string,
  account: Account,
  signerManager: SignerManager,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> {
  const parsedData: EthTypedMessage = JSON.parse(message)
  // ethers computes EIP712Domain type for you, so we should not pass it in directly
  // or else ethers will get confused about which type is the primary type
  // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
  delete parsedData.types.EIP712Domain

  return signTypedData(
    parsedData.domain,
    parsedData.types,
    parsedData.message,
    account,
    signerManager,
    provider
  )
}
