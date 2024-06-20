import { Interface } from '@ethersproject/abi'
import { BigNumber, BigNumberish } from 'ethers'
import abi from '../../../abis/Seaport.json'
import { ETH_ADDRESS } from '../../utils/constants'
import { Permit2Permit, encodeInputTokenOptions } from '../../utils/inputTokens'
import { CommandType, RoutePlanner } from '../../utils/routerCommands'
import { TradeConfig } from '../Command'
import { BuyItem, Market, NFTTrade, TokenType } from '../NFTTrade'

export type SeaportData = {
  items: Order[]
  recipient: string // address
  protocolAddress: string
  inputTokenProcessing?: InputTokenProcessing[]
}

export type InputTokenProcessing = {
  token: string
  permit2Permit?: Permit2Permit
  protocolApproval: boolean
  permit2TransferFrom: boolean
}

export type FulfillmentComponent = {
  orderIndex: BigNumberish
  itemIndex: BigNumberish
}

export type OfferItem = {
  itemType: BigNumberish // enum
  token: string // address
  identifierOrCriteria: BigNumberish
  startAmount: BigNumberish
  endAmount: BigNumberish
}

export type ConsiderationItem = OfferItem & {
  recipient: string
}

export type Order = {
  parameters: OrderParameters
  signature: string
}

type OrderParameters = {
  offerer: string // address,
  offer: OfferItem[]
  consideration: ConsiderationItem[]
  orderType: BigNumberish // enum
  startTime: BigNumberish
  endTime: BigNumberish
  zoneHash: string // bytes32
  zone: string // address
  salt: BigNumberish
  conduitKey: string // bytes32,
  totalOriginalConsiderationItems: BigNumberish
}

export type AdvancedOrder = Order & {
  numerator: BigNumber // uint120
  denominator: BigNumber // uint120
  extraData: string // bytes
}

export class SeaportTrade extends NFTTrade<SeaportData> {
  public static INTERFACE: Interface = new Interface(abi)
  public static OPENSEA_CONDUIT_KEY: string = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000'

  constructor(orders: SeaportData[]) {
    super(Market.Seaport, orders)
  }

  encode(planner: RoutePlanner, config: TradeConfig): void {
    for (const order of this.orders) {
      const advancedOrders: AdvancedOrder[] = []
      const orderFulfillments: FulfillmentComponent[][] = order.items.map((_, index) => [
        { orderIndex: index, itemIndex: 0 },
      ])
      const considerationFulFillments: FulfillmentComponent[][] = this.getConsiderationFulfillments(order.items)

      for (const item of order.items) {
        const { advancedOrder } = this.getAdvancedOrderParams(item)
        advancedOrders.push(advancedOrder)
      }

      let calldata: string
      if (advancedOrders.length == 1) {
        calldata = SeaportTrade.INTERFACE.encodeFunctionData('fulfillAdvancedOrder', [
          advancedOrders[0],
          [],
          SeaportTrade.OPENSEA_CONDUIT_KEY,
          order.recipient,
        ])
      } else {
        calldata = SeaportTrade.INTERFACE.encodeFunctionData('fulfillAvailableAdvancedOrders', [
          advancedOrders,
          [],
          orderFulfillments,
          considerationFulFillments,
          SeaportTrade.OPENSEA_CONDUIT_KEY,
          order.recipient,
          100, // TODO: look into making this a better number
        ])
      }

      if (order.inputTokenProcessing) {
        for (const inputToken of order.inputTokenProcessing)
          encodeInputTokenOptions(planner, {
            approval: inputToken.protocolApproval
              ? { token: inputToken.token, protocol: order.protocolAddress }
              : undefined,
            permit2Permit: inputToken.permit2Permit,
            permit2TransferFrom: inputToken.permit2TransferFrom
              ? { token: inputToken.token, amount: this.getTotalOrderPrice(order, inputToken.token).toString() }
              : undefined,
          })
      }

      planner.addCommand(
        this.commandMap(order.protocolAddress),
        [this.getTotalOrderPrice(order, ETH_ADDRESS).toString(), calldata],
        config.allowRevert
      )
    }
  }

  getBuyItems(): BuyItem[] {
    const buyItems: BuyItem[] = []
    for (const order of this.orders) {
      for (const item of order.items) {
        for (const offer of item.parameters.offer) {
          buyItems.push({
            tokenAddress: offer.token,
            tokenId: offer.identifierOrCriteria,
            tokenType: TokenType.ERC721,
          })
        }
      }
    }
    return buyItems
  }

  getInputTokens(): Set<string> {
    const inputTokens = new Set<string>()
    for (const order of this.orders) {
      for (const item of order.items) {
        for (const consideration of item.parameters.consideration) {
          const token = consideration.token.toLowerCase()
          inputTokens.add(token)
        }
      }
    }
    return inputTokens
  }

  getTotalOrderPrice(order: SeaportData, token: string = ETH_ADDRESS): BigNumber {
    let totalOrderPrice = BigNumber.from(0)
    for (const item of order.items) {
      totalOrderPrice = totalOrderPrice.add(this.calculateValue(item.parameters.consideration, token))
    }
    return totalOrderPrice
  }

  getTotalPrice(token: string = ETH_ADDRESS): BigNumber {
    let totalPrice = BigNumber.from(0)
    for (const order of this.orders) {
      for (const item of order.items) {
        totalPrice = totalPrice.add(this.calculateValue(item.parameters.consideration, token))
      }
    }
    return totalPrice
  }

  private commandMap(protocolAddress: string): CommandType {
    switch (protocolAddress.toLowerCase()) {
      case '0x00000000000000adc04c56bf30ac9d3c0aaf14dc': // Seaport v1.5
        return CommandType.SEAPORT_V1_5
      case '0x00000000000001ad428e4906ae43d8f9852d0dd6': // Seaport v1.4
        return CommandType.SEAPORT_V1_4
      default:
        throw new Error('unsupported Seaport address')
    }
  }

  private getConsiderationFulfillments(protocolDatas: Order[]): FulfillmentComponent[][] {
    const considerationFulfillments: FulfillmentComponent[][] = []
    const considerationRecipients: string[] = []

    for (const i in protocolDatas) {
      const protocolData = protocolDatas[i]!

      for (const j in protocolData.parameters.consideration) {
        const item = protocolData.parameters.consideration[j]!

        if (considerationRecipients.findIndex((x) => x === item.recipient) === -1) {
          considerationRecipients.push(item.recipient)
        }

        const recipientIndex = considerationRecipients.findIndex((x) => x === item.recipient)

        if (!considerationFulfillments[recipientIndex]) {
          considerationFulfillments.push([
            {
              orderIndex: i,
              itemIndex: j,
            },
          ])
        } else {
          considerationFulfillments[recipientIndex]!.push({
            orderIndex: i,
            itemIndex: j,
          })
        }
      }
    }
    return considerationFulfillments
  }

  private getAdvancedOrderParams(data: Order): { advancedOrder: AdvancedOrder } {
    const advancedOrder = {
      parameters: data.parameters,
      numerator: BigNumber.from('1'),
      denominator: BigNumber.from('1'),
      signature: data.signature,
      extraData: '0x00',
    }
    return { advancedOrder }
  }

  private calculateValue(considerations: ConsiderationItem[], token: string): BigNumber {
    return considerations.reduce(
      (amt: BigNumber, consideration: ConsiderationItem) =>
        consideration.token.toLowerCase() == token.toLowerCase() ? amt.add(consideration.startAmount) : amt,
      BigNumber.from(0)
    )
  }
}
