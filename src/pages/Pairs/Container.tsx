import React from 'react'
import { Currency, ETHER } from 'dxswap-sdk'

import { PairCard } from './Card'
import { AutoRowCleanGap } from '../../components/Row'

export default function Container() {
  const USDC: Currency = {
    decimals: 18,
    name: 'USD Coin',
    symbol: 'USDC'
  }

  return (
    <AutoRowCleanGap gap={8}>
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
    </AutoRowCleanGap>
  )
}
