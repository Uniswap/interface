import { Interface } from '@ethersproject/abi'
import { BigNumber, BigNumberish } from 'ethers'
import abi from '../../../abis/X2Y2.json'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

type X2Y2PartialData = {
  signedInput: string
  recipient: string
  tokenAddress: string
  tokenId: BigNumberish
  price: BigNumberish
}

export type X2Y2_721_Data = X2Y2PartialData & {
  tokenType: TokenType.ERC721
}

export type X2Y2_1155_Data = X2Y2PartialData & {
  tokenType: TokenType.ERC1155
  tokenAmount: BigNumberish
}

export type X2Y2Data = X2Y2_721_Data | X2Y2_1155_Data

export class X2Y2Trade extends NFTTrade<X2Y2Data> {
  public static INTERFACE: Interface = new Interface(abi)

  constructor(orders: X2Y2Data[]) {
    super(Market.X2Y2, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    for (const item of this.orders) {
      const functionSelector = X2Y2Trade.INTERFACE.getSighash(X2Y2Trade.INTERFACE.getFunction('run'))
      const calldata = functionSelector + item.signedInput.slice(2)

      if (item.tokenType == TokenType.ERC721) {
        planner.addCommand(
          CommandType.X2Y2_721,
          [item.price, calldata, item.recipient, item.tokenAddress, item.tokenId],
          config.allowRevert
        )
      } else if (item.tokenType == TokenType.ERC1155) {
        planner.addCommand(
          CommandType.X2Y2_1155,
          [item.price, calldata, item.recipient, item.tokenAddress, item.tokenId, item.tokenAmount],
          config.allowRevert
        )
      }
    }
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const item of this.orders) {
      buyItems.push({
        tokenAddress: item.tokenAddress,
        tokenId: item.tokenId,
        tokenType: item.tokenType,
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
