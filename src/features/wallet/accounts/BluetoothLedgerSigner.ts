import Eth from '@ledgerhq/hw-app-eth'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { BigNumber, providers, Signer, utils } from 'ethers'

export const defaultPath = "m/44'/60'/0'/0/0"

function waiter(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

// Adapted from:
// https://github.com/ethers-io/ethers.js/blob/master/packages/hardware-wallets/src.ts/ledger.ts
// https://github.com/ethers-io/ethers.js/pull/1971/files
export class BluetoothLedgerSigner extends Signer {
  readonly path: string
  readonly _eth: () => Promise<Eth>

  constructor(public deviceId: string, provider?: providers.Provider, path?: string) {
    super()
    if (path == null) {
      path = defaultPath
    }

    this.deviceId = deviceId
    this.path = path
    this._eth = async () => {
      const deviceTransport = await TransportBLE.open(this.deviceId)
      const eth = new Eth(deviceTransport)
      await eth.getAppConfiguration()
      return eth
    }

    utils.defineReadOnly(this, 'provider', provider)
  }

  _retry<T = any>(callback: (eth: Eth) => Promise<T>, timeout?: number): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if (timeout && timeout > 0) {
        setTimeout(() => {
          reject(new Error('timeout'))
        }, timeout)
      }

      const eth = await this._eth()

      // Wait up to 5 seconds
      for (let i = 0; i < 50; i++) {
        try {
          const result = await callback(eth)
          return resolve(result)
        } catch (error: any) {
          if (error.id !== 'TransportLocked') {
            // swallow errors for now
            // return reject(error)
          }
        }
        await waiter(100)
      }

      return reject(new Error('timeout'))
    })
  }

  async getAddress(): Promise<string> {
    const account = await this._retry((eth) => eth.getAddress(this.path))
    return utils.getAddress(account.address)
  }

  async signMessage(message: utils.Bytes | string): Promise<string> {
    if (typeof message === 'string') {
      message = utils.toUtf8Bytes(message)
    }

    const messageHex = utils.hexlify(message).substring(2)

    const sig = await this._retry((eth) => eth.signPersonalMessage(this.path, messageHex))
    sig.r = '0x' + sig.r
    sig.s = '0x' + sig.s
    return utils.joinSignature(sig)
  }

  async signTransaction(transaction: providers.TransactionRequest): Promise<string> {
    const tx = await utils.resolveProperties(transaction)
    const baseTx: utils.UnsignedTransaction = {
      chainId: tx.chainId || undefined,
      data: tx.data || undefined,
      gasLimit: tx.gasLimit || undefined,
      gasPrice: tx.gasPrice || undefined,
      nonce: tx.nonce ? BigNumber.from(tx.nonce).toNumber() : undefined,
      maxFeePerGas: tx.maxFeePerGas || undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas || undefined,
      type: tx.type,
      to: tx.to || undefined,
      value: tx.value || undefined,
    }

    const unsignedTx = utils.serializeTransaction(baseTx).substring(2)
    const sig = await this._retry((eth) => eth.signTransaction(this.path, unsignedTx))

    return utils.serializeTransaction(baseTx, {
      v: BigNumber.from('0x' + sig.v).toNumber(),
      r: '0x' + sig.r,
      s: '0x' + sig.s,
    })
  }

  connect(provider: providers.Provider): Signer {
    return new BluetoothLedgerSigner(this.deviceId, provider, this.path)
  }
}
