import { Interface } from '@ethersproject/abi'
import { BigNumber, BigNumberish } from 'ethers'
import abi from '../../../abis/NFT20.json'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

export type NFT20Data = {
  tokenAddress: string
  tokenIds: BigNumberish[]
  tokenAmounts: BigNumberish[]
  recipient: string
  fee: BigNumberish
  isV3: boolean
  value: BigNumberish
}

export class NFT20Trade extends NFTTrade<NFT20Data> {
  public static INTERFACE: Interface = new Interface(abi)

  constructor(orders: NFT20Data[]) {
    super(Market.NFT20, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    for (const order of this.orders) {
      const calldata = NFT20Trade.INTERFACE.encodeFunctionData('ethForNft', [
        order.tokenAddress,
        order.tokenIds,
        order.tokenAmounts,
        order.recipient,
        order.fee,
        order.isV3,
      ])
      planner.addCommand(CommandType.NFT20, [order.value, calldata], config.allowRevert)
    }
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const pool of this.orders) {
      for (const tokenId of pool.tokenIds) {
        buyItems.push({
          tokenAddress: pool.tokenAddress,
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
