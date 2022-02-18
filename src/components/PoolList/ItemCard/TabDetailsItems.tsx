import ItemCardInfoRow, { ItemCardInfoRowPriceRange } from 'components/PoolList/ItemCard/ItemCardInfoRow'
import { t } from '@lingui/macro'
import { AMP_LIQUIDITY_HINT, SUBGRAPH_AMP_MULTIPLIER } from 'constants/index'
import { feeRangeCalc } from 'utils/dmm'
import React from 'react'
import { SubgraphPoolData } from 'state/pools/hooks'
import { formattedNum } from 'utils'
import { Fraction, JSBI } from '@dynamic-amm/sdk'

export default function TabDetailsItems({ poolData }: { poolData: SubgraphPoolData }) {
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))
  const ampLiquidity = formattedNum(`${parseFloat(amp.toSignificant(5)) * parseFloat(poolData.reserveUSD)}`, true)

  return (
    <>
      <ItemCardInfoRow name={t`AMP Liquidity`} value={ampLiquidity as string} infoHelperText={AMP_LIQUIDITY_HINT} />
      <ItemCardInfoRowPriceRange poolData={poolData} />
      <ItemCardInfoRow name={t`Fee Range`} value={feeRangeCalc(+amp.toSignificant(5))} />
    </>
  )
}
