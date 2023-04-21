// If the message to be signed is a hex string, it must be converted to an array:

import { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'
import { ensureLeading0x } from 'wallet/src/utils/addresses'
import { TypedDataDomain, TypedDataField, Wallet, ethers } from 'ethers'
import { arrayify, isHexString } from 'ethers/lib/utils'
import { logger } from '../../logger/logger'
import { Account } from '../types'
import { SignerManager } from './SignerManager'

type EthTypedMessage = {
  domain: TypedDataDomain
  types: Record<string, Array<TypedDataField>>
  message: Record<string, unknown>
}

// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
export async function signMessage(
  message: string,
  account: Account,
  signerManager: SignerManager,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> {
  // Mobile code does not explicitly connect to provider,
  // Extension needs to connect to provider to ensure correct chain
  const unconnectedSigner = await signerManager.getSignerForAccount(account)
  const signer = provider
    ? unconnectedSigner?.connect(provider)
    : unconnectedSigner

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

export async function signTypedData(
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  value: Record<string, unknown>,
  account: Account,
  signerManager: SignerManager,
  provider?: ethers.providers.JsonRpcProvider
): Promise<string> {
  // Mobile code does not explicitly connect to provider,
  // Extension needs to connect to provider to ensure correct chain
  const unconnectedSigner = await signerManager.getSignerForAccount(account)
  const signer = provider
    ? unconnectedSigner?.connect(provider)
    : unconnectedSigner

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
  signerManager: SignerManager,
  provider: ethers.providers.JsonRpcProvider
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
