import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { Bytes, Signer, UnsignedTransaction, providers, utils } from 'ethers'
import { hexlify } from 'ethers/lib/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring.native'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

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
    if (typeof message === 'string') {
      return Keyring.signMessageForAddress(this.address, message)
    }

    // chainID isn't available here, but is not needed for signing hashes so just default to Mainnet
    return Keyring.signHashForAddress(this.address, hexlify(message).slice(2), ChainId.Mainnet)
  }

  // reference: https://github.com/ethers-io/ethers.js/blob/ce8f1e4015c0f27bf178238770b1325136e3351a/packages/wallet/src.ts/index.ts#L135
  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, unknown>
  ): Promise<string> {
    const signature = await Keyring.signHashForAddress(
      this.address,
      _TypedDataEncoder.hash(domain, types, value).slice(2),
      toSupportedChainId(domain.chainId) || ChainId.Mainnet
    )
    return signature
  }

  async signTransaction(transaction: providers.TransactionRequest): Promise<string> {
    const tx = await utils.resolveProperties(transaction)
    if (tx.chainId === undefined) {
      throw new Error('Expected chainId to be defined')
    }
    if (tx.from != null) {
      if (!areAddressesEqual(tx.from, this.address)) {
        throw new Error('transaction from address mismatch')
      }
      delete tx.from
    }

    const ut = <UnsignedTransaction>tx
    const hashedTx = utils.keccak256(utils.serializeTransaction(ut))
    const signature = await Keyring.signTransactionHashForAddress(
      this.address,
      hashedTx.slice(2),
      tx.chainId
    )

    return utils.serializeTransaction(ut, `0x${signature}`)
  }

  connect(provider: providers.Provider): NativeSigner {
    return new NativeSigner(this.address, provider)
  }
}
