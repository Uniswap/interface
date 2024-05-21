import { Interface } from '@ethersproject/abi'
import { BigNumber } from 'ethers'
import abi from '../../../abis/LooksRareV2.json'
import { ZERO_ADDRESS } from '../../utils/constants'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

export type MakerOrder = {
  quoteType: number
  globalNonce: string
  subsetNonce: string
  orderNonce: string
  strategyId: number
  collectionType: number
  collection: string
  currency: string
  signer: string
  startTime: number
  endTime: number
  price: string
  itemIds: string[]
  amounts: string[]
  additionalParameters: string
}

export type TakerOrder = {
  recipient: string
  additionalParameters: string
}

export type MerkleProof = {
  value: string
  position: number
}

export type MerkleTree = {
  root: string
  proof: MerkleProof[]
}

export type LRV2APIOrder = MakerOrder & {
  id: string
  hash: string
  signature: string
  createdAt: string
  merkleRoot?: string
  merkleProof?: MerkleProof[]
  status: string
}

export type LooksRareV2Data = {
  apiOrder: LRV2APIOrder
  taker: string
}

export class LooksRareV2Trade extends NFTTrade<LooksRareV2Data> {
  public static INTERFACE: Interface = new Interface(abi)
  private static ERC721_ORDER = 0

  constructor(orders: LooksRareV2Data[]) {
    super(Market.LooksRareV2, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    const { takerBids, makerOrders, makerSignatures, totalValue, merkleTrees } = this.refactorAPIData(this.orders)

    let calldata
    if (this.orders.length == 1) {
      calldata = LooksRareV2Trade.INTERFACE.encodeFunctionData('executeTakerBid', [
        takerBids[0],
        makerOrders[0],
        makerSignatures[0],
        merkleTrees[0],
        ZERO_ADDRESS, // affiliate
      ])
    } else {
      calldata = LooksRareV2Trade.INTERFACE.encodeFunctionData('executeMultipleTakerBids', [
        takerBids,
        makerOrders,
        makerSignatures,
        merkleTrees,
        ZERO_ADDRESS, // affiliate
        false, // isAtomic (we deal with this in allowRevert)
      ])
    }

    planner.addCommand(CommandType.LOOKS_RARE_V2, [totalValue, calldata], config.allowRevert)
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const item of this.orders) {
      const tokenAddress = item.apiOrder.collection
      const tokenType =
        item.apiOrder.collectionType == LooksRareV2Trade.ERC721_ORDER ? TokenType.ERC721 : TokenType.ERC1155
      for (const tokenId of item.apiOrder.itemIds)
        buyItems.push({
          tokenAddress,
          tokenId,
          tokenType,
        })
    }
    return buyItems
  }

  getTotalPrice(): BigNumber {
    let total = BigNumber.from(0)
    for (const item of this.orders) {
      total = total.add(item.apiOrder.price)
    }
    return total
  }

  private refactorAPIData(orders: LooksRareV2Data[]): {
    takerBids: TakerOrder[]
    makerOrders: MakerOrder[]
    makerSignatures: string[]
    totalValue: BigNumber
    merkleTrees: MerkleTree[]
  } {
    const takerBids: TakerOrder[] = []
    const makerOrders: MakerOrder[] = []
    const makerSignatures: string[] = []
    let totalValue: BigNumber = BigNumber.from(0)
    const merkleTrees: MerkleTree[] = []

    orders.forEach((order) => {
      makerOrders.push({ ...order.apiOrder })

      makerSignatures.push(order.apiOrder.signature)

      takerBids.push({
        recipient: order.taker,
        additionalParameters: '0x',
      })

      totalValue = totalValue.add(BigNumber.from(order.apiOrder.price))

      merkleTrees.push({
        root: order.apiOrder.merkleRoot ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
        proof: order.apiOrder.merkleProof ?? [],
      })
    })

    return { takerBids, makerOrders, makerSignatures, totalValue, merkleTrees }
  }
}
