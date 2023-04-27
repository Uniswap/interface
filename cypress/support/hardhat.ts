import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { HardhatUtils, Network } from 'cypress-hardhat/lib/browser'

export class HardhatProvider extends Eip1193Bridge {
  readonly utils: HardhatUtils
  readonly chainId: string
  readonly wallet: Wallet

  isMetaMask = true

  constructor(network: Network) {
    const utils = new HardhatUtils(network)
    const wallet = new Wallet(utils.account.privateKey, utils.provider)
    super(wallet, utils.provider)

    this.utils = utils
    this.chainId = `0x${network.chainId.toString(16)}`
    this.wallet = wallet
  }

  async sendAsync(...args: any[]) {
    return this.send(...args)
  }

  async send(...args: any[]) {
    console.debug('hardhat:send', ...args)

    // Parse callback form.
    const isCallbackForm = typeof args[0] === 'object' && typeof args[1] === 'function'
    let callback = <T>(error: Error | null, result?: { result: T }) => {
      if (error) throw error
      return result?.result
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

    let result
    try {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
          result = [this.wallet.address]
          break
        case 'eth_chainId':
          result = this.chainId
          break
        case 'eth_sendTransaction': {
          // Eip1193Bridge doesn't support .gas and .from directly, so we massage it to satisfy ethers' expectations.
          // See https://github.com/ethers-io/ethers.js/issues/1683.
          params[0].gasLimit = params[0].gas
          delete params[0].gas
          delete params[0].from

          const req = JsonRpcProvider.hexlifyTransaction(params[0])
          req.gasLimit = req.gas
          delete req.gas

          result = (await this.signer.sendTransaction(req)).hash
          break
        }
        default:
          result = await super.send(method, params)
      }
      console.debug('hardhat:receive', method, result)
      return callback(null, { result })
    } catch (error) {
      console.debug('hardhat:error', method, error)
      return callback(error as Error)
    }
  }
}
