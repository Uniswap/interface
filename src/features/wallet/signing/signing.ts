// If the message to be signed is a hex string, it must be converted to an array:

import { providers, TypedDataDomain, TypedDataField, Wallet } from 'ethers'
import { arrayify, isHexString } from 'ethers/lib/utils'
import { Account } from 'src/features/wallet/accounts/types'
import { NativeSigner } from 'src/features/wallet/signing/NativeSigner'
import { SignerManager } from 'src/features/wallet/signing/SignerManager'
import { ensureLeading0x } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'

type EthTypedMessage = {
  domain: TypedDataDomain
  types: Record<string, Array<TypedDataField>>
  message: Record<string, unknown>
}

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage(
  message: string,
  account: Account,
  signerManager: SignerManager
): Promise<string> {
  const signer = await signerManager.getSignerForAccount(account)
  if (!signer) {
    logger.error('signers', 'signMessage', `no signer found for ${account}`)
    return ''
  }

  let signature
  if (isHexString(ensureLeading0x(message))) {
    signature = await signer.signMessage(arrayify(ensureLeading0x(message)))
  } else {
    signature = await signer.signMessage(message)
  }

  return ensureLeading0x(signature)
}

export async function signTransaction(
  transaction: providers.TransactionRequest,
  account: Account,
  signerManager: SignerManager
): Promise<string> {
  const signer = await signerManager.getSignerForAccount(account)
  if (!signer) {
    logger.error('signers', 'signTransaction', `no signer found for ${account}`)
    return ''
  }

  const signature = await signer.signTransaction(transaction)
  return ensureLeading0x(signature)
}

export async function signTypedData(
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  value: Record<string, unknown>,
  account: Account,
  signerManager: SignerManager
): Promise<string> {
  const signer = await signerManager.getSignerForAccount(account)

  // https://github.com/LedgerHQ/ledgerjs/issues/86
  // Ledger does not support signTypedData yet
  if (!(signer instanceof NativeSigner) && !(signer instanceof Wallet)) {
    logger.error('signers', 'signTypedData', 'cannot sign typed data')
    return ''
  }

  const signature = await signer._signTypedData(domain, types, value)

  return ensureLeading0x(signature)
}

export async function signTypedDataMessage(
  message: string,
  account: Account,
  signerManager: SignerManager
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
    signerManager
  )
}
