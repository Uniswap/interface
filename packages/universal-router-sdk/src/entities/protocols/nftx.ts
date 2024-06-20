import { Interface } from '@ethersproject/abi'
import { BigNumber, BigNumberish } from 'ethers'
import abi from '../../../abis/NFTXZap.json'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

export type NFTXData = {
  recipient: string
  vaultId: BigNumberish
  tokenAddress: string
  tokenIds: BigNumberish[]
  value: BigNumber
  swapCalldata: string
}

export class NFTXTrade extends NFTTrade<NFTXData> {
  public static INTERFACE: Interface = new Interface(abi)

  constructor(orders: NFTXData[]) {
    super(Market.NFTX, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    for (const order of this.orders) {
      const calldata = NFTXTrade.INTERFACE.encodeFunctionData('buyAndRedeem', [
        order.vaultId,
        order.tokenIds.length,
        order.tokenIds,
        order.swapCalldata,
        order.recipient,
      ])

      planner.addCommand(CommandType.NFTX, [order.value, calldata], config.allowRevert)
    }
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const order of this.orders) {
      for (const tokenId of order.tokenIds) {
        buyItems.push({
          tokenAddress: order.tokenAddress,
          tokenId,
          tokenType: TokenType.ERC721,
        })
      }
    }
    return buyItems
  }

  getTotalPrice(): BigNumber {
    let total = BigNumber.from(0)
    for (const item of this.orders) {
      total = total.add(item.value)
    }
    return total
  }
}
