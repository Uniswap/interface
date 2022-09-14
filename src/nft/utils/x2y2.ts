import { defaultAbiCoder } from '@ethersproject/abi'
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { hexZeroPad } from '@ethersproject/bytes'
import { AddressZero } from '@ethersproject/constants'
import { keccak256 } from '@ethersproject/keccak256'
import type { Web3Provider } from '@ethersproject/providers'
import { randomBytes } from '@ethersproject/random'

const dataParamType = `tuple(address token, uint256 tokenId)[]`
const orderItemParamType = `tuple(uint256 price, bytes data)`
const orderParamTypes = [
  `uint256`,
  `address`,
  `uint256`,
  `uint256`,
  `uint256`,
  `uint256`,
  `address`,
  `bytes`,
  `uint256`,
  `${orderItemParamType}[]`,
]
const orderParamType = `tuple(uint256 salt, address user, uint256 network, uint256 intent, uint256 delegateType, uint256 deadline, address currency, bytes dataMask, ${orderItemParamType}[] items, bytes32 r, bytes32 s, uint8 v, uint8 signVersion)`

export type OfferItem = {
  price: BigNumber
  tokens: {
    token: string
    tokenId: BigNumberish
  }[]
}

type OrderItem = {
  price: BigNumberish
  data: string
}

type Order = {
  salt: BigNumberish
  user: string
  network: BigNumberish
  intent: BigNumberish
  delegateType: BigNumberish
  deadline: BigNumberish
  currency: string
  dataMask: string
  items: OrderItem[]
  // signature
  r: string
  s: string
  v: number
  signVersion: number
}

export type OrderPayload = {
  order: string
  isBundle: boolean
  bundleName: string
  bundleDesc: string
  orderIds: number[]
  changePrice: boolean
  isCollection: boolean
}

export type OrderResp = {
  success: boolean
  code: number
  error?: string
}

const randomSalt = () => {
  const randomHex = BigNumber.from(randomBytes(16)).toHexString()
  return hexZeroPad(randomHex, 64)
}

const encodeItemData = (data: { token: string; tokenId: BigNumberish }[]) => {
  return defaultAbiCoder.encode([dataParamType], [data])
}

export const signOrderData = async (web3Provider: Web3Provider, order: Order) => {
  const orderData = defaultAbiCoder.encode(orderParamTypes, [
    order.salt,
    order.user,
    order.network,
    order.intent,
    order.delegateType,
    order.deadline,
    order.currency,
    order.dataMask,
    order.items.length,
    order.items,
  ])
  const orderHash = keccak256(orderData)
  const orderSig = (await web3Provider.send('personal_sign', [orderHash, order.user])) as string
  order.r = `0x${orderSig.slice(2, 66)}`
  order.s = `0x${orderSig.slice(66, 130)}`
  order.v = parseInt(orderSig.slice(130, 132), 16)
  fixSignature(order)
}

const fixSignature = (data: Order) => {
  // in geth its always 27/28, in ganache its 0/1. Change to 27/28 to prevent
  // signature malleability if version is 0/1
  // see https://github.com/ethereum/go-ethereum/blob/v1.8.23/internal/ethapi/api.go#L465
  if (data.v < 27) {
    data.v = data.v + 27
  }
}

export const encodeOrder = (order: Order): string => {
  return defaultAbiCoder.encode([orderParamType], [order])
}

export const createSellOrder = (user: string, deadline: number, items: OfferItem[]): Order => {
  const salt = randomSalt()
  const network = 1 // mainnet
  const intent = 1 // INTENT_SELL
  const delegateType = 1 // DELEGATION_TYPE_ERC721
  const currency = AddressZero // ETH
  return {
    salt,
    user,
    network,
    intent,
    delegateType,
    deadline,
    currency,
    dataMask: '0x',
    items: items.map((item) => ({
      price: item.price,
      data: encodeItemData(item.tokens),
    })),
    r: '',
    s: '',
    v: 0,
    signVersion: 1,
  }
}
