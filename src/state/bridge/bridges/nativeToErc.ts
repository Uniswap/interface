import { TransactionResponse } from '@ethersproject/providers'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import TokenBridge from './tokenBridge'
import {
  getHomeCustomBridgeAddress,
  getHomeBridgeNativeToErcContract,
  getERC677TokenContract,
  getForeignCustomBridgeAddress,
  calculateGasMargin,
  getForeignBridgeNativeToErcContract
} from '../../../utils'
import {
  tokenTransferSuccess,
  tokenTransferPending,
  confirmTokenTransferPending,
  confirmTokenTransferSuccess,
  transferError
} from '../actions'
import { FOREIGN_BRIDGE_CHAIN } from '../../../constants'
import { getChainNetworkLibrary, getNetworkLibrary } from '../../../connectors'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../../constants/bridge'

export default class NativeToErcBridge extends TokenBridge {
  private readonly FOREIGN_BRIDGE_EVENT = 'RelayedMessage'
  private readonly HOME_BRIDGE_EVENT = 'AffirmationCompleted'

  private get homeBridgeAddress() {
    const address = getHomeCustomBridgeAddress(this.tokenAddress)
    if (!address) {
      throw Error('Home bridge address not provided')
    }
    return address
  }

  private get foreignBridgeAddress() {
    const address = getForeignCustomBridgeAddress(this.tokenAddress)
    if (!address) {
      throw Error('Foreign bridge address not provided')
    }
    return address
  }

  private get homeBridgeContract() {
    return getHomeBridgeNativeToErcContract(this.homeBridgeAddress, this.library, this.account)
  }

  private get homeNetworkLibrary() {
    return getNetworkLibrary()
  }

  private get foreignNetworkLibrary() {
    return getChainNetworkLibrary(FOREIGN_BRIDGE_CHAIN)
  }

  private buildHomeTransaction() {
    return {
      to: this.homeBridgeAddress,
      from: this.account,
      value: parseUnits(formatUnits(this.amount.raw.toString()))
    }
  }

  async transferToForeign(): Promise<TransactionResponse | null> {
    this.dispatch(tokenTransferPending())

    const response = await this.homeBridgeContract.signer.sendTransaction(this.buildHomeTransaction())

    this.dispatch(tokenTransferSuccess())

    return response
  }

  async transferToHome(): Promise<TransactionResponse> {
    this.dispatch(tokenTransferPending())

    const contract = getERC677TokenContract(this.tokenAddress, this.library, this.account)
    const args = [this.foreignBridgeAddress, this.amount.raw.toString(), []]

    const estimatedGas = await contract.estimateGas.transferAndCall(...args, {})
    const response = await contract.transferAndCall(...args, { gasLimit: calculateGasMargin(estimatedGas) })

    this.dispatch(tokenTransferSuccess())

    return response
  }

  watchForeignBridge(): Promise<void> {
    return new Promise(resolve => {
      const contract = getForeignBridgeNativeToErcContract(
        this.foreignBridgeAddress,
        this.foreignNetworkLibrary,
        this.account
      )

      this.dispatch(confirmTokenTransferPending())

      const listener = (recipient: string) => {
        if (recipient === this.account) {
          contract.removeListener(this.FOREIGN_BRIDGE_EVENT, listener)
          this.dispatch(confirmTokenTransferSuccess())
          resolve()
        }
      }

      contract.on(this.FOREIGN_BRIDGE_EVENT, listener)
    })
  }

  watchHomeBridge(): Promise<void> {
    return new Promise(resolve => {
      const contract = getHomeBridgeNativeToErcContract(this.homeBridgeAddress, this.homeNetworkLibrary, this.account)

      this.dispatch(confirmTokenTransferPending())

      const listener = (recipient: string) => {
        if (recipient === this.account) {
          contract.removeListener(this.HOME_BRIDGE_EVENT, listener)
          this.dispatch(confirmTokenTransferSuccess())
          resolve()
        }
      }

      contract.on(this.HOME_BRIDGE_EVENT, listener)
    })
  }

  async executeTransaction() {
    try {
      let response
      if (this.isHome) {
        response = await this.transferToForeign()
        await this.watchForeignBridge()
      } else {
        response = await this.transferToHome()
        await this.waitForTransaction(response.hash, DEFAULT_CONFIRMATIONS_LIMIT)
        await this.watchHomeBridge()
      }
      this.addTransaction(response, { summary: this.transactionSummary, text: this.transactionText })
    } catch (error) {
      this.dispatch(transferError())

      if (error?.code !== 4001) console.log(error)
    }
  }
}
