import TokenBridge from './tokenBridge'
import { Contract } from 'ethers'
import * as Sentry from '@sentry/react'
import {
  GAS_PRICE,
  BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS,
  BINANCE_ERC20_TO_ERC677_HOME_BRIDGE_ADDRESS,
  BINANCE_CHAIN_ID
} from '../../../constants'
import { getNetworkLibrary, getChainNetworkLibrary } from '../../../connectors'
import {
  getHomeMultiAMBErc20ToErc677Contract,
  getERC677TokenContract,
  calculateGasMargin,
  getForeignMultiAMBErc20ToErc677Contract,
  pollEvent
} from '../../../utils'
import {
  tokenTransferPending,
  tokenTransferSuccess,
  confirmTokenTransferPending,
  confirmTokenTransferSuccess,
  transferError
} from '../actions'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../../constants/bridge'
import HomeBridgeABI from '../../../constants/abis/homeMultiAMBErc20ToErc677.json'

export default class BinanceBridge extends TokenBridge {
  private readonly BRIDGE_EVENT = 'TokensBridged(address,address,uint256,bytes32)'
  homeContract: Contract | undefined

  private get homeBridgeAddress() {
    return BINANCE_ERC20_TO_ERC677_HOME_BRIDGE_ADDRESS
  }

  private get foreignBridgeAddress() {
    return BINANCE_ERC20_TO_ERC677_FOREIGN_BRIDGE_ADDRESS
  }

  private get homeNetworkLibrary() {
    return getNetworkLibrary()
  }

  private get foreignNetworkLibrary() {
    return getChainNetworkLibrary(BINANCE_CHAIN_ID)
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
    const method = contract['relayTokens(address,uint256)']
    const args = [this.tokenAddress, this.amount.raw.toString()]

    const response = await method(...args)

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

  get transactionSummary(): string {
    return this.isHome
      ? 'Your tokens were transferred successfully to Binance please switch to Binance to use them'
      : 'Your tokens were transferred successfully to Fuse please switch to Fuse to use them'
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
