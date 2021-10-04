import { providers, Signer, utils } from 'ethers'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { Address } from 'src/utils/Address'

// A signer that uses native keystore to access keys
export class NativeSigner extends Signer {
  address: Address | undefined

  async init() {
    if (this.address) throw new Error('NativeSigner already initialized')

    this.address = Address.from(NULL_ADDRESS)
    throw new Error('TODO implement init')
  }

  async getAddress(): Promise<string> {
    if (!this.address) throw new Error('NativeSigner must be initiated before getting address')
    return this.address.toString()
  }

  async signMessage(message: utils.Bytes | string): Promise<string> {
    throw new Error('TODO implement signMessage: ' + message)
  }

  async signTransaction(transaction: providers.TransactionRequest): Promise<string> {
    throw new Error('TODO implement signMessage: ' + transaction)
  }

  connect(): Signer {
    throw new Error('Connect method unimplemented on NativeSigner')
  }
}
