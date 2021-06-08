import React from 'react'
import { Token } from '@uniswap/sdk-core'
import { DarkBlueCard } from 'components/Card'
import LiquidityDistributionChart from './Chart'

export default function LiquidityDistribution({
  tokenA,
  tokenB,
}: {
  tokenA: Token | undefined
  tokenB: Token | undefined
}) {
  return (
    <DarkBlueCard>
      <LiquidityDistributionChart tokenA={tokenA} tokenB={tokenB} />
    </DarkBlueCard>
  )
}
