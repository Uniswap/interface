import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import { providers, Signer, UnsignedTransaction, utils } from 'ethers'
import { signMessageForAddress, signTransactionHashForAddress } from 'src/lib/RNEthersRs'

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

  signMessage(message: utils.Bytes | string): Promise<string> {
    return signMessageForAddress(this.address, message)
  }

  // reference: https://github.com/ethers-io/ethers.js/blob/ce8f1e4015c0f27bf178238770b1325136e3351a/packages/wallet/src.ts/index.ts#L135
  _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ): Promise<string> {
    return signMessageForAddress(this.address, _TypedDataEncoder.hash(domain, types, value))
  }

  async signTransaction(transaction: providers.TransactionRequest): Promise<string> {
    const tx = await utils.resolveProperties(transaction)
    if (tx.from != null) {
      if (utils.getAddress(tx.from) !== this.address) {
        throw new Error('transaction from address mismatch')
      }
      delete tx.from
    }

    const ut = <UnsignedTransaction>tx
    const hashedTx = utils.keccak256(utils.serializeTransaction(ut))
    const signature = await signTransactionHashForAddress(
      this.address,
      hashedTx.slice(2),
      tx.chainId!
    )

    return utils.serializeTransaction(ut, `0x${signature}`)
  }

  connect(provider: providers.Provider): NativeSigner {
    return new NativeSigner(this.address, provider)
  }
}
