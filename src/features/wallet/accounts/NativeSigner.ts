import { providers, Signer, Transaction, utils } from 'ethers'
import { signMessageForAddress, signTransactionForAddress } from 'src/lib/RNEthersRs'

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

  async signTransaction(transaction: providers.TransactionRequest) {
    const tx = (await utils.resolveProperties(transaction)) as Transaction
    // not working properly right now
    return signTransactionForAddress(this.address, tx)
  }

  connect(provider: providers.Provider): NativeSigner {
    return new NativeSigner(this.address, provider)
  }
}
