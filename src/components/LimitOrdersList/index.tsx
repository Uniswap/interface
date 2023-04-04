import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import React from 'react'

import { AutoColumn } from '../Column'
import MemoizedLimitOrdersListItem from '../LimitOrdersListItem'

export interface OrderDetails {
  owner: string
  tokenId: BigNumber
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  processed: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
}

type OrderListProps = React.PropsWithChildren<{
  orders: OrderDetails[]
  fundingBalance?: CurrencyAmount<Token>
  minBalance?: CurrencyAmount<Token>
}>

export default function LimitOrdersList({ orders, fundingBalance, minBalance }: OrderListProps) {
  const isUnderfunded = minBalance && fundingBalance ? !minBalance?.lessThan(fundingBalance?.quotient) : false

  return (
    <AutoColumn gap="1rem">
      {orders.map((item, index) => (
        <MemoizedLimitOrdersListItem key={index} limitOrderDetails={item} isUnderfunded={isUnderfunded} />
      ))}
    </AutoColumn>
  )
}
