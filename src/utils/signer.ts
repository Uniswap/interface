import { Signer } from 'ethers'
import { JsonRpcSigner, Provider } from 'ethers/providers'
import { TransactionResponse } from 'ethers/providers/abstract-provider'

/**
 * Wraps a JsonRpcSigner and replaces `sendTransaction` with `sendUncheckedTransaction`
 */
export default class UncheckedJsonRpcSigner extends Signer {
  private readonly signer: JsonRpcSigner
  public readonly provider: Provider

  constructor(signer: JsonRpcSigner) {
    super()
    this.signer = signer
    this.provider = signer.provider
  }

  getAddress(): Promise<string> {
    return this.signer.getAddress()
  }

  sendTransaction(transaction): Promise<TransactionResponse> {
    return this.signer.sendUncheckedTransaction(transaction).then(hash => {
      return {
        hash,
        nonce: null,
        gasLimit: null,
        gasPrice: null,
        data: null,
        value: null,
        chainId: null,
        confirmations: 0,
        from: null,
        wait: confirmations => {
          return this.signer.provider.waitForTransaction(hash, confirmations)
        }
      }
    })
  }

  signMessage(message) {
    return this.signer.signMessage(message)
  }
}
