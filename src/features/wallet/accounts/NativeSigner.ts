import { BigNumber, providers, Signer, utils } from 'ethers'
import { signMessageForAddress, signTransactionForAddress } from 'src/lib/RNEthersRs'

async function convertTxToEthersRS(txRequest: providers.TransactionRequest) {
  const tx: any = await utils.resolveProperties(txRequest)
  const result: any = {
    chainId: tx.chainId!,
    data: tx.data?.toString()!,
    gas: tx.gasLimit.toHexString(),
    maxFeePerGas: tx.maxFeePerGas.toHexString()!,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas.toHexString(),
    nonce: BigNumber.from(tx.nonce).toHexString(),
    to: tx.to,
    type: BigNumber.from(tx.type).toHexString(),
    value: tx.value,
  }
  return result
}

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
    const tx = await convertTxToEthersRS(transaction)
    if (transaction.from != null) {
      if (utils.getAddress(transaction.from) !== this.address) {
        throw new Error('transaction from address mismatch')
      }
    }
    tx.from = this.address

    const rlpEncodedTx = await signTransactionForAddress(this.address, tx, tx.chainId!)
    const decoded = utils.RLP.decode(`0x${rlpEncodedTx}`)
    const parsedTx = utils.parseTransaction(decoded)

    const sig = {
      r: parsedTx.r!,
      s: parsedTx.s!,
      v: parsedTx.v!,
    }

    return utils.serializeTransaction(parsedTx, sig)
  }

  connect(provider: providers.Provider): NativeSigner {
    return new NativeSigner(this.address, provider)
  }
}
