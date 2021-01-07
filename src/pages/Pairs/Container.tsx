import React from 'react'
import styled from 'styled-components'
import { Currency, ETHER } from 'dxswap-sdk'

import { PairCard } from './Card'
import { AutoRowCleanGap } from '../../components/Row'

const CardContainer = styled(AutoRowCleanGap)`
  height: 330px;
  overflow-x: hidden;
  scrollbar-width: 'none';
  -ms-overflow-style: 'none';
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`

export default function Container() {
  const USDC: Currency = {
    decimals: 18,
    name: 'USD Coin',
    symbol: 'USDC'
  }

  return (
    <CardContainer gap={8}>
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
      <PairCard currency0={USDC} currency1={ETHER} />
    </CardContainer>
  )
}
