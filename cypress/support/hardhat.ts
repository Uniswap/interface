import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'
import { Wallet } from '@ethersproject/wallet'
import { HardhatUtils, Network } from 'cypress-hardhat'

export class HardhatProvider extends Eip1193Bridge {
  utils: HardhatUtils
  chainId: string
  signer: Wallet
  provider: typeof this.utils.provider

  constructor(network: Network) {
    const utils = new HardhatUtils(network)
    const signer = new Wallet(utils.account.privateKey, utils.provider)
    super(signer, utils.provider)

    this.utils = utils
    this.chainId = `0x${network.chainId.toString(16)}`
    this.signer = signer
    this.provider = utils.provider
  }

  async sendAsync(...args: any[]) {
    return this.send(...args)
  }

  async send(...args: any[]) {
    console.debug('send', ...args)

    // Parse callback form.
    const isCallbackForm = typeof args[0] === 'object' && typeof args[1] === 'function'
    let callback = <T>(error: Error | null, result?: { result: T }) => {
      if (error) throw error
      return result
    }
    let method
    let params
    if (isCallbackForm) {
      callback = args[1]
      method = args[0].method
      params = args[0].params
    } else {
      method = args[0]
      params = args[1]
    }

    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return callback(null, { result: [this.signer.address] })
      case 'eth_chainId':
        return callback(null, { result: this.chainId })
    }

    try {
      const result = await super.send(method, params)
      console.debug('receive', method, result)
      return callback(null, { result })
    } catch (error) {
      return callback(error as Error)
    }
  }
}
