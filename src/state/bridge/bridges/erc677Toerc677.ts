import TokenBridge from './tokenBridge'
import {
  tokenTransferPending,
  tokenTransferSuccess,
  confirmTokenTransferPending,
  confirmTokenTransferSuccess,
  transferError
} from '../actions'
import {
  getERC677TokenContract,
  getForeignBridgeNativeToErcAddress,
  calculateGasMargin,
  getHomeBridgeNativeToErcAddress,
  getAMBErc677To677Contract
} from '../../../utils'
import { FOREIGN_BRIDGE_CHAIN } from '../../../constants'
import { getNetworkLibraryByChain, getNetworkLibrary } from '../../../connectors'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../../constants/bridge'

export default class Erc677ToErc677Bridge extends TokenBridge {
  private readonly BRIDGE_EVENT = 'TokensBridged'

  private get homeBridgeAddress() {
    const address = getHomeBridgeNativeToErcAddress(this.tokenAddress)
    if (!address) {
      throw Error('Home bridge address not provided')
    }
    return address
  }

  private get homeNetworkLibrary() {
    return getNetworkLibrary()
  }

  private get foreignNetworkLibrary() {
    return getNetworkLibraryByChain(this.chainId)
  }

  private foreignBridgeAddress(chainId = this.chainId) {
    const address = getForeignBridgeNativeToErcAddress(this.tokenAddress, chainId)
    if (!address) {
      throw Error('Foreign bridge address not provided')
    }
    return address
  }

  async transferToForeign() {
    this.dispatch(tokenTransferPending())

    const contract = getERC677TokenContract(this.tokenAddress, this.library, this.account)
    const args = [this.homeBridgeAddress, this.amount.raw.toString(), []]

    const estimatedGas = await contract.estimateGas.transferAndCall(...args, {})
    const response = await contract.transferAndCall(...args, { gasLimit: calculateGasMargin(estimatedGas) })

    this.dispatch(tokenTransferSuccess())

    return response
  }

  async transferToHome() {
    this.dispatch(tokenTransferPending())

    const contract = getERC677TokenContract(this.tokenAddress, this.library, this.account)
    const args = [this.foreignBridgeAddress(), this.amount.raw.toString(), []]

    const estimatedGas = await contract.estimateGas.transferAndCall(...args, {})
    const response = await contract.transferAndCall(...args, { gasLimit: calculateGasMargin(estimatedGas) })

    this.dispatch(tokenTransferSuccess())

    return response
  }

  watchForeignBridge() {
    return new Promise(resolve => {
      const contract = getAMBErc677To677Contract(
        this.foreignBridgeAddress(FOREIGN_BRIDGE_CHAIN),
        this.foreignNetworkLibrary,
        this.account
      )

      this.dispatch(confirmTokenTransferPending())

      const listener = (recipient: string) => {
        if (recipient === this.account) {
          contract.removeListener(this.BRIDGE_EVENT, listener)
          this.dispatch(confirmTokenTransferSuccess())
          resolve()
        }
      }

      contract.on(this.BRIDGE_EVENT, listener)
    })
  }

  watchHomeBridge() {
    return new Promise(resolve => {
      const contract = getAMBErc677To677Contract(this.homeBridgeAddress, this.homeNetworkLibrary, this.account)

      this.dispatch(confirmTokenTransferPending())

      const listener = (recipient: string) => {
        if (recipient === this.account) {
          contract.removeListener(this.BRIDGE_EVENT, listener)
          this.dispatch(confirmTokenTransferSuccess())
          resolve()
        }
      }

      contract.on(this.BRIDGE_EVENT, listener)
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
      this.addTransaction(response, { summary: this.transactionSummary })
    } catch (error) {
      this.dispatch(transferError())

      if (error?.code !== 4001) console.log(error)
    }
  }
}
