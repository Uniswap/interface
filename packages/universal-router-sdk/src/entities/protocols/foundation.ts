import { Interface } from '@ethersproject/abi'
import { BigNumber, BigNumberish } from 'ethers'
import abi from '../../../abis/Foundation.json'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

export type FoundationData = {
  recipient: string
  tokenAddress: string
  tokenId: BigNumberish
  price: BigNumberish
  referrer: string // address
}

export class FoundationTrade extends NFTTrade<FoundationData> {
  public static INTERFACE: Interface = new Interface(abi)

  constructor(orders: FoundationData[]) {
    super(Market.Foundation, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    for (const item of this.orders) {
      const calldata = FoundationTrade.INTERFACE.encodeFunctionData('buyV2', [
        item.tokenAddress,
        item.tokenId,
        item.price,
        item.referrer,
      ])
      planner.addCommand(
        CommandType.FOUNDATION,
        [item.price, calldata, item.recipient, item.tokenAddress, item.tokenId],
        config.allowRevert
      )
    }
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const item of this.orders) {
      buyItems.push({
        tokenAddress: item.tokenAddress,
        tokenId: item.tokenId,
        tokenType: TokenType.ERC721,
      })
    }
    return buyItems
  }

  getTotalPrice(): BigNumber {
    let total = BigNumber.from(0)
    for (const item of this.orders) {
      total = total.add(item.price)
    }
    return total
  }
}
