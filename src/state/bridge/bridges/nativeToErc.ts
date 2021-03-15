import { TransactionResponse } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import * as Sentry from '@sentry/react'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import TokenBridge from './tokenBridge'
import { getHomeBridgeNativeToErcContract, getERC677TokenContract, calculateGasMargin, pollEvent } from '../../../utils'
import {
  tokenTransferSuccess,
  tokenTransferPending,
  confirmTokenTransferPending,
  confirmTokenTransferSuccess,
  transferError
} from '../actions'
import {
  GAS_PRICE,
  FUSE_NATIVE_TO_ERC677_BRIDGE_HOME_ADDRESS,
  FUSE_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
} from '../../../constants'
import { getChainNetworkLibrary, getNetworkLibrary, ETHEREUM_CHAIN_ID } from '../../../connectors'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../../constants/bridge'
import HomeBridgeABI from '../../../constants/abis/homeBridgeNativeToErc.json'
import ForeignBridgeABI from '../../../constants/abis/foreignBridgeNativeToErc.json'

export default class NativeToErcBridge extends TokenBridge {
  private readonly FOREIGN_BRIDGE_EVENT = 'RelayedMessage(address,uint256,bytes32)'
  private readonly HOME_BRIDGE_EVENT = 'AffirmationCompleted(address,uint256,bytes32)'

  private get homeBridgeAddress() {
    return FUSE_NATIVE_TO_ERC677_BRIDGE_HOME_ADDRESS
  }

  private get foreignBridgeAddress() {
    return FUSE_NATIVE_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
  }

  private get homeBridgeContract() {
    return getHomeBridgeNativeToErcContract(this.homeBridgeAddress, this.library, this.account)
  }

  private get homeNetworkLibrary() {
    return getNetworkLibrary()
  }

  private get foreignNetworkLibrary() {
    return getChainNetworkLibrary(ETHEREUM_CHAIN_ID)
  }

  private toBigNumber(value: string): BigNumber {
    return parseUnits(formatUnits(value))
  }

  private buildHomeTransaction() {
    return {
      to: this.homeBridgeAddress,
      from: this.account,
      value: this.toBigNumber(this.amount.raw.toString()),
      ...(GAS_PRICE && { gasPrice: this.toBigNumber(GAS_PRICE) })
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

  async watchForeignBridge() {
    this.dispatch(confirmTokenTransferPending())

    await pollEvent(
      this.FOREIGN_BRIDGE_EVENT,
      this.foreignBridgeAddress,
      ForeignBridgeABI,
      this.foreignNetworkLibrary,
      async (eventArgs: any[]) => {
        const [recipient] = eventArgs
        return recipient === this.account
      }
    )

    this.dispatch(confirmTokenTransferSuccess())
  }

  async watchHomeBridge() {
    this.dispatch(confirmTokenTransferPending())

    await pollEvent(
      this.HOME_BRIDGE_EVENT,
      this.homeBridgeAddress,
      HomeBridgeABI,
      this.homeNetworkLibrary,
      async (eventArgs: any[]) => {
        const [recipient] = eventArgs
        return recipient === this.account
      }
    )

    this.dispatch(confirmTokenTransferSuccess())
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

      if (error?.code !== 4001) {
        Sentry.captureException(error, {
          tags: {
            section: 'Bridge',
            bridgeType: 'NativeToERC',
            isHome: this.isHome
          }
        })

        console.log(error)
      }
    }
  }
}
