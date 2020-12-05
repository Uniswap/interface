import { TransactionResponse } from '@ethersproject/providers'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import TokenBridge from './tokenBridge'
import {
  getHomeBridgeNativeToErcAddress,
  getHomeBridgeNativeToErcContract,
  getERC677TokenContract,
  getForeignBridgeNativeToErcAddress,
  calculateGasMargin,
  getForeignBridgeNativeToErcContract,
  getAMBErc677To677Contract
} from '../../../utils'
import {
  tokenTransferSuccess,
  tokenTransferPending,
  confirmTokenTransferPending,
  confirmTokenTransferSuccess,
  transferError
} from '../actions'
import { FOREIGN_BRIDGE_CHAIN } from '../../../constants'
import { getNetworkLibraryByChain, getNetworkLibrary } from '../../../connectors'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../../constants/bridge'

export default class NativeToErcBridge extends TokenBridge {
  private readonly FOREIGN_BRIDGE_EVENT = 'RelayedMessage'
  private readonly HOME_BRIDGE_EVENT = 'AffirmationCompleted'

  private get homeBridgeAddress() {
    const address = getHomeBridgeNativeToErcAddress(this.tokenAddress)
    if (!address) {
      throw Error('Home bridge address not provided')
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
    return getNetworkLibraryByChain(this.chainId)
  }

  private buildHomeTransaction() {
    return {
      to: this.homeBridgeAddress,
      from: this.account,
      value: parseUnits(formatUnits(this.amount.raw.toString()))
    }
  }

  private foreignBridgeAddress(chainId = this.chainId) {
    const address = getForeignBridgeNativeToErcAddress(this.tokenAddress, chainId)
    if (!address) {
      throw Error('Foreign bridge address not provided')
    }
    return address
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
    const args = [this.foreignBridgeAddress(), this.amount.raw.toString(), []]

    const estimatedGas = await contract.estimateGas.transferAndCall(...args, {})
    const response = await contract.transferAndCall(...args, { gasLimit: calculateGasMargin(estimatedGas) })

    this.dispatch(tokenTransferSuccess())

    return response
  }

  watchForeignBridge(): Promise<void> {
    return new Promise(resolve => {
      const contract = getForeignBridgeNativeToErcContract(
        this.foreignBridgeAddress(FOREIGN_BRIDGE_CHAIN),
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
      const contract = getAMBErc677To677Contract(this.homeBridgeAddress, this.homeNetworkLibrary, this.account)

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
      this.addTransaction(response, { summary: this.transactionSummary })
    } catch (error) {
      this.dispatch(transferError())

      if (error?.code !== 4001) console.log(error)
    }
  }
}
