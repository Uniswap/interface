import { Interface } from '@ethersproject/abi'
import { BigNumber } from 'ethers'
import abi from '../../../abis/Element.json'
import { ZERO_ADDRESS } from '../../utils/constants'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

export interface Fee {
  recipient: string
  amount: string
  feeData: string
}

// For now we are not adding ERC1155 support, but we might want it in future
// So structuring the ElementData like this to give us flexibility to support it
type ElementPartialData = {
  maker: string
  taker: string
  expiry: string
  nonce: string
  erc20Token: string
  erc20TokenAmount: string
  fees: Fee[]
}

export type ERC721SellOrder = ElementPartialData & {
  nft: string
  nftId: string
}

export type OrderSignature = {
  signatureType: number // 0 for 721 and 1 for presigned
  v: number
  r: string
  s: string
}

export type ElementData = {
  order: ERC721SellOrder
  signature: OrderSignature
  recipient: string
}

export class ElementTrade extends NFTTrade<ElementData> {
  private static ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.toLowerCase()
  public static INTERFACE: Interface = new Interface(abi)

  constructor(orders: ElementData[]) {
    super(Market.Element, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    for (const item of this.orders) {
      if (item.order.erc20Token.toLowerCase() != ElementTrade.ETH_ADDRESS) throw new Error('Only ETH supported')
      if (item.order.taker != ZERO_ADDRESS && item.recipient.toLowerCase() != item.order.taker.toLowerCase())
        throw new Error('Order has fixed taker')

      const value = this.getOrderPriceIncludingFees(item.order)

      const calldata = ElementTrade.INTERFACE.encodeFunctionData('buyERC721Ex', [
        item.order,
        item.signature,
        item.order.taker == ZERO_ADDRESS ? item.recipient : item.order.taker,
        '0x', // extraData
      ])

      planner.addCommand(CommandType.ELEMENT_MARKET, [value.toString(), calldata], config.allowRevert)
    }
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const item of this.orders) {
      buyItems.push({
        tokenAddress: item.order.nft,
        tokenId: item.order.nftId,
        tokenType: TokenType.ERC721,
      })
    }
    return buyItems
  }

  getTotalPrice(): BigNumber {
    let total = BigNumber.from(0)
    for (const item of this.orders) {
      total = total.add(this.getOrderPriceIncludingFees(item.order))
    }
    return total
  }

  /// @dev If there are fees, we have to send an ETH value of the erc20TokenAmount + sum of fees
  /// However, for the calldata we have to send the original erc20TokenAmount, so we separate the logic here
  /// so we never directly edit the original order object
  getOrderPriceIncludingFees(order: ERC721SellOrder): BigNumber {
    const nftPrice = BigNumber.from(order.erc20TokenAmount)
    if (order.fees) {
      return order.fees.reduce((acc, fee) => {
        return acc.add(BigNumber.from(fee.amount))
      }, nftPrice)
    }
    return nftPrice
  }
}
