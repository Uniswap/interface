import { Interface } from '@ethersproject/abi'
import { BigNumber, BigNumberish } from 'ethers'
import abi from '../../../abis/Sudoswap.json'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

type PairSwap = {
  swapInfo: {
    pair: string // address
    nftIds: BigNumberish[]
  }
  tokenAddress: string // address
  maxCost: BigNumberish
}

export type SudoswapData = {
  swaps: PairSwap[]
  nftRecipient: string
  ethRecipient: string
  deadline: BigNumberish
}

export class SudoswapTrade extends NFTTrade<SudoswapData> {
  public static INTERFACE: Interface = new Interface(abi)

  constructor(orders: SudoswapData[]) {
    super(Market.Sudoswap, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    for (const order of this.orders) {
      const calldata = SudoswapTrade.INTERFACE.encodeFunctionData('robustSwapETHForSpecificNFTs', [
        order.swaps.map((swap) => {
          return { swapInfo: swap.swapInfo, maxCost: swap.maxCost }
        }),
        order.ethRecipient,
        order.nftRecipient,
        order.deadline,
      ])
      const value = order.swaps.reduce((prevVal, swap) => {
        return prevVal.add(swap.maxCost)
      }, BigNumber.from(0))
      planner.addCommand(CommandType.SUDOSWAP, [value, calldata], config.allowRevert)
    }
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const order of this.orders) {
      for (const swap of order.swaps) {
        for (const tokenId of swap.swapInfo.nftIds) {
          buyItems.push({
            tokenAddress: swap.tokenAddress,
            tokenId,
            tokenType: TokenType.ERC721,
          })
        }
      }
    }
    return buyItems
  }

  getTotalPrice(): BigNumber {
    let total = BigNumber.from(0)
    for (const order of this.orders) {
      for (const swap of order.swaps) {
        total = total.add(swap.maxCost)
      }
    }
    return total
  }
}
