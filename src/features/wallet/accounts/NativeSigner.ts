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
