import TokenBridge from './tokenBridge'
import { Contract } from '@ethersproject/contracts'
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
  getForeignMultiAMBErc20ToErc677Contract
} from '../../../utils'
import { CurrencyAmount, ChainId } from '@fuseio/fuse-swap-sdk'
import { Web3Provider } from '@ethersproject/providers'
import { AppDispatch } from '../../index'
import { getNetworkLibrary, getChainNetworkLibrary } from '../../../connectors'
import {
  FOREIGN_BRIDGE_CHAIN,
  FUSE_MAINNET_HOME_BRIDGE_ADDRESS,
  FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS,
  ROPSTEN_FOREIGN_BRIDGE_ADDRESS,
  MAINNET_FOREIGN_BRIDGE_ADDRESS
} from '../../../constants'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../../constants/bridge'

export default class Erc20ToErc677Bridge extends TokenBridge {
  private readonly BRIDGE_EVENT = 'TokensBridged'
  readonly bridgeAddress: string
  homeContract: Contract | undefined

  constructor(
    tokenAddress: string,
    tokenSymbol: string,
    amount: CurrencyAmount,
    library: Web3Provider,
    chainId: number,
    account: string,
    dispatch: AppDispatch,
    isHome: boolean,
    addTransaction: (...args: any) => void,
    bridgeAddress: string
  ) {
    super(tokenAddress, tokenSymbol, amount, library, chainId, account, dispatch, isHome, addTransaction)
    this.bridgeAddress = bridgeAddress
  }

  private get homeBridgeAddress() {
    return FOREIGN_BRIDGE_CHAIN === ChainId.MAINNET
      ? FUSE_MAINNET_HOME_BRIDGE_ADDRESS
      : FUSE_ROPSTEN_HOME_BRIDGE_ADDRESS
  }

  private get foreignBridgeAddress() {
    return FOREIGN_BRIDGE_CHAIN === ChainId.MAINNET ? MAINNET_FOREIGN_BRIDGE_ADDRESS : ROPSTEN_FOREIGN_BRIDGE_ADDRESS
  }

  private get homeNetworkLibrary() {
    return getNetworkLibrary()
  }

  private get foreignNetworkLibrary() {
    return getChainNetworkLibrary(FOREIGN_BRIDGE_CHAIN)
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
    const args = [this.bridgeAddress, this.amount.raw.toString(), []]

    const estimatedGas = await contract.estimateGas.transferAndCall(...args, {})
    const response = await contract.transferAndCall(...args, { gasLimit: calculateGasMargin(estimatedGas) })

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
    return new Promise<string>(resolve => {
      this.dispatch(confirmTokenTransferPending())

      const listener = async (homeTokenAddress: string, recipient: string) => {
        const address = await this.homeBridgeContract.foreignTokenAddress(homeTokenAddress)
        if (recipient === this.account && this.tokenAddress === address) {
          this.homeBridgeContract.removeListener(this.BRIDGE_EVENT, listener)
          this.dispatch(confirmTokenTransferSuccess())
          resolve(homeTokenAddress)
        }
      }

      this.homeBridgeContract.on(this.BRIDGE_EVENT, listener)
    })
  }

  async watchForeignBridge() {
    return new Promise<string>(resolve => {
      const foreignBridgeContract = getForeignMultiAMBErc20ToErc677Contract(
        this.foreignBridgeAddress,
        this.foreignNetworkLibrary,
        this.account
      )

      this.dispatch(confirmTokenTransferPending())

      const listener = async (foreignTokenAddress: string, recipient: string) => {
        const address = await this.homeBridgeContract.foreignTokenAddress(this.tokenAddress)

        if (recipient === this.account && foreignTokenAddress === address) {
          foreignBridgeContract.removeListener(this.BRIDGE_EVENT, listener)
          this.dispatch(confirmTokenTransferSuccess())
          resolve(foreignTokenAddress)
        }
      }

      foreignBridgeContract.on(this.BRIDGE_EVENT, listener)
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
