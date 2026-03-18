/* eslint-disable max-params */
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { Bytes, providers, Signer, UnsignedTransaction, utils } from 'ethers'
import { hexlify } from 'ethers/lib/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { areAddressesEqual, ensureLeading0x } from 'uniswap/src/utils/addresses'
import { HexString, isValidHexString } from 'utilities/src/addresses/hex'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring.native'

// A signer that uses native keystore to access keys
export class NativeSigner extends Signer {
  readonly address: string

  constructor(address: string, provider?: providers.Provider) {
    super()

    this.address = address

    if (provider && !providers.Provider.isProvider(provider)) {
      throw new Error('invalid provider' + provider)
    }

    utils.defineReadOnly(this, 'provider', provider)
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.address)
  }

  signMessage(message: string | Bytes): Promise<string> {
    const signaturePromise =
      typeof message === 'string'
        ? Keyring.signMessageForAddress(this.address, message)
        : // chainID isn't available here, but is not needed for signing hashes so just default to Mainnet
          Keyring.signHashForAddress(this.address, hexlify(message).slice(2), UniverseChainId.Mainnet)
    return signaturePromise.then((signature) => ensureLeading0x(signature))
  }

  signHashForAddress(address: string, hash: string | Bytes, chainId: number): Promise<string> {
    return Keyring.signHashForAddress(address, hexlify(hash).slice(2), chainId).then((signature) => {
      return ensureLeading0x(signature)
    })
  }

  // reference: https://github.com/ethers-io/ethers.js/blob/ce8f1e4015c0f27bf178238770b1325136e3351a/packages/wallet/src.ts/index.ts#L135
  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, unknown>,
  ): Promise<string> {
    const signature = await Keyring.signHashForAddress(
      this.address,
      _TypedDataEncoder.hash(domain, types, value).slice(2),
      // TODO: WALL-4919: Remove hardcoded Mainnet
      toSupportedChainId(domain.chainId) || UniverseChainId.Mainnet,
    )
    return signature
  }

  async signTransaction(transaction: providers.TransactionRequest): Promise<HexString> {
    const tx = await utils.resolveProperties(transaction)
    if (tx.chainId === undefined) {
      throw new Error('Expected chainId to be defined')
    }
    if (tx.from != null) {
      if (
        !areAddressesEqual({
          addressInput1: { address: tx.from, chainId: tx.chainId },
          addressInput2: { address: this.address, chainId: tx.chainId },
        })
      ) {
        throw new Error('transaction from address mismatch')
      }
      delete tx.from
    }

    const ut = <UnsignedTransaction>tx
    const hashedTx = utils.keccak256(utils.serializeTransaction(ut))
    const signature = await Keyring.signTransactionHashForAddress(this.address, hashedTx.slice(2), tx.chainId)

    const signedTx = utils.serializeTransaction(ut, `0x${signature}`)
    if (!isValidHexString(signedTx)) {
      throw new Error('Invalid signed transaction')
    }

    return signedTx
  }

  connect(provider: providers.Provider): NativeSigner {
    return new NativeSigner(this.address, provider)
  }
}
