import { CurrencyAmount } from '@fuseio/fuse-swap-sdk'
import { Web3Provider } from '@ethersproject/providers'
import { AppDispatch } from '../../index'
import { confirmTransactionPending, updateConfirmationsCount, confirmTransactionSuccess } from '../actions'

export enum BridgeMode {
  NATIVE_TO_ERC,
  ERC20_TO_ERC677,
  ERC677_TO_ERC677
}

abstract class TokenBridge {
  readonly tokenAddress: string
  readonly tokenSymbol: string
  readonly amount: CurrencyAmount
  readonly library: Web3Provider
  readonly chainId: number
  readonly account: string
  readonly dispatch: AppDispatch
  readonly isHome: boolean
  readonly addTransaction: (...args: any) => void

  constructor(
    tokenAddress: string,
    tokenSymbol: string,
    amount: CurrencyAmount,
    library: Web3Provider,
    chainId: number,
    account: string,
    dispatch: AppDispatch,
    isHome: boolean,
    addTransaction: (...args: any) => void
  ) {
    this.tokenAddress = tokenAddress
    this.tokenSymbol = tokenSymbol
    this.amount = amount
    this.library = library
    this.chainId = chainId
    this.account = account
    this.dispatch = dispatch
    this.isHome = isHome
    this.addTransaction = addTransaction
  }

  transferToHome() {
    throw new Error('Unimplemented method')
  }

  transferToForeign() {
    throw new Error('Unimplemented method')
  }

  watchHomeBridge() {
    throw new Error('Unimplemented method')
  }

  watchForeignBridge() {
    throw new Error('Unimplemented method')
  }

  executeTransaction(): Promise<void> {
    throw new Error('Unimplemented method')
  }

  get transactionSummary(): string {
    return this.isHome
      ? 'Your tokens were transferred successfully to Ethereum please switch to Ethereum to use them'
      : 'Your tokens were transferred successfully to Fuse please switch to Fuse to use them'
  }

  get transactionText(): string {
    return `Transfer ${this.tokenSymbol}`
  }

  async waitForTransaction(transactionHash: string, confirmations: number) {
    const receipt = await this.library.getTransactionReceipt(transactionHash)

    if ((receipt ? receipt.confirmations : 0) >= confirmations) return receipt

    this.dispatch(confirmTransactionPending())
    return new Promise(resolve => {
      let done = false

      const interval = setInterval(async () => {
        const receipt = await this.library.getTransactionReceipt(transactionHash)
        const confirmedBlocks = receipt ? receipt.confirmations : 0
        const count = confirmedBlocks

        if (!receipt) {
          this.dispatch(updateConfirmationsCount({ confirmations: count }))
          return
        }
        if (!done) {
          const val = count > confirmations ? confirmations : count
          this.dispatch(updateConfirmationsCount({ confirmations: val }))
        }
        if (count < confirmations) {
          return
        }

        done = true
        clearInterval(interval)
        this.dispatch(confirmTransactionSuccess())
        resolve(receipt)
      }, 500)
    })
  }
}

export default TokenBridge
