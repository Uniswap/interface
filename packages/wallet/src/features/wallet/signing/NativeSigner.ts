import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { Bytes, Signer, UnsignedTransaction, providers, utils } from 'ethers'
import { hexlify } from 'ethers/lib/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

/**
 * A signer that uses a native keyring to access keys
 * NOTE: provide Keyring.platform.ts at runtime.
 */

export class NativeSigner extends Signer {
  constructor(private readonly address: string, provider?: providers.Provider) {
    super()

    if (provider && !providers.Provider.isProvider(provider)) {
      throw new Error(`Invalid provider: ${provider}`)
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
      _TypedDataEncoder.hash(domain, types, value),
      toSupportedChainId(domain.chainId) || ChainId.Mainnet
    )
    return signature
  }

  async signTransaction(transaction: providers.TransactionRequest): Promise<string> {
    const tx = await utils.resolveProperties(transaction)

    if (tx.chainId === undefined) {
      throw new Error('Attempted to sign transaction with an undefined chain')
    }

    if (tx.from != null) {
      if (!areAddressesEqual(tx.from, this.address)) {
        throw new Error(`Signing address does not match the tx 'from' address`)
      }
      delete tx.from
    }

    const ut = <UnsignedTransaction>tx
    const hashedTx = utils.keccak256(utils.serializeTransaction(ut))
    const signature = await Keyring.signTransactionHashForAddress(
      this.address,
      hashedTx,
      tx.chainId || ChainId.Mainnet
    )

    return utils.serializeTransaction(ut, signature)
  }

  connect(provider: providers.Provider): NativeSigner {
    return new NativeSigner(this.address, provider)
  }
}
