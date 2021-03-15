import { Contract } from '@ethersproject/contracts'
import * as Sentry from '@sentry/react'
import TokenBridge from './tokenBridge'
import {
  GAS_PRICE,
  FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS,
  FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
} from '../../../constants'
import {
  tokenTransferPending,
  tokenTransferSuccess,
  confirmTokenTransferPending,
  confirmTokenTransferSuccess,
  transferError
} from '../actions'
import {
  calculateGasMargin,
  getERC677TokenContract,
  getHomeMultiAMBErc20ToErc677Contract,
  getForeignMultiAMBErc20ToErc677Contract,
  pollEvent
} from '../../../utils'
import { getNetworkLibrary, getChainNetworkLibrary, ETHEREUM_CHAIN_ID } from '../../../connectors'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../../constants/bridge'
import HomeBridgeABI from '../../../constants/abis/homeMultiAMBErc20ToErc677.json'

export default class Erc20ToErc677Bridge extends TokenBridge {
  private readonly BRIDGE_EVENT = 'TokensBridged(address,address,uint256,bytes32)'
  homeContract: Contract | undefined

  private get homeBridgeAddress() {
    return FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS
  }

  private get foreignBridgeAddress() {
    return FUSE_ERC20_TO_ERC677_BRIDGE_FOREIGN_ADDRESS
  }

  private get homeNetworkLibrary() {
    return getNetworkLibrary()
  }

  private get foreignNetworkLibrary() {
    return getChainNetworkLibrary(ETHEREUM_CHAIN_ID)
  }

  private get homeBridgeContract() {
    if (!this.homeContract) {
      const contract = getHomeMultiAMBErc20ToErc677Contract(
        this.homeBridgeAddress,
        this.homeNetworkLibrary,
        this.account
      )
      this.homeContract = contract
      return contract
    }
    return this.homeContract
  }

  async transferToForeign() {
    this.dispatch(tokenTransferPending())

    const contract = getERC677TokenContract(this.tokenAddress, this.library, this.account)
    const args = [this.homeBridgeAddress, this.amount.raw.toString(), []]

    const estimatedGas = await contract.estimateGas.transferAndCall(...args, {})
    const response = await contract.transferAndCall(...args, {
      ...(GAS_PRICE && { gasPrice: GAS_PRICE }),
      gasLimit: calculateGasMargin(estimatedGas)
    })

    this.dispatch(tokenTransferSuccess())

    return response
  }

  async transferToHome() {
    this.dispatch(tokenTransferPending())

    const contract = getForeignMultiAMBErc20ToErc677Contract(this.foreignBridgeAddress, this.library, this.account)
    const estimate = contract.estimateGas['relayTokens(address,uint256)']
    const method = contract['relayTokens(address,uint256)']
    const args = [this.tokenAddress, this.amount.raw.toString()]

    const estimatedGas = await estimate(...args, {})
    const response = await method(...args, { gasLimit: calculateGasMargin(estimatedGas) })

    this.dispatch(tokenTransferSuccess())

    return response
  }

  async watchHomeBridge() {
    this.dispatch(confirmTokenTransferPending())

    await pollEvent(
      this.BRIDGE_EVENT,
      this.homeBridgeAddress,
      HomeBridgeABI,
      this.homeNetworkLibrary,
      async (eventArgs: any[]) => {
        const [homeTokenAddress, recipient] = eventArgs
        const address = await this.homeBridgeContract.foreignTokenAddress(homeTokenAddress)
        return recipient === this.account && this.tokenAddress === address
      }
    )

    this.dispatch(confirmTokenTransferSuccess())
  }

  async watchForeignBridge() {
    this.dispatch(confirmTokenTransferPending())

    await pollEvent(
      this.BRIDGE_EVENT,
      this.foreignBridgeAddress,
      HomeBridgeABI,
      this.foreignNetworkLibrary,
      async (eventArgs: any[]) => {
        const [foreignTokenAddress, recipient] = eventArgs
        const address = await this.homeBridgeContract.foreignTokenAddress(this.tokenAddress)
        return recipient === this.account && foreignTokenAddress === address
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
            bridgeType: 'ERC20ToERC677',
            token: this.tokenSymbol,
            isHome: this.isHome
          }
        })

        console.log(error)
      }
    }
  }
}
