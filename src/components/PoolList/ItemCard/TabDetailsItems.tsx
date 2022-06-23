import ItemCardInfoRow, { ItemCardInfoRowPriceRange } from 'components/PoolList/ItemCard/ItemCardInfoRow'
import { t } from '@lingui/macro'
import { AMP_LIQUIDITY_HINT, SUBGRAPH_AMP_MULTIPLIER, ONLY_STATIC_FEE_CHAINS } from 'constants/index'
import { feeRangeCalc } from 'utils/dmm'
import React from 'react'
import { SubgraphPoolData } from 'state/pools/hooks'
import { formattedNum } from 'utils'
import { Fraction } from '@kyberswap/ks-sdk-core'
import { useActiveWeb3React } from 'hooks'
import JSBI from 'jsbi'

export default function TabDetailsItems({ poolData }: { poolData: SubgraphPoolData }) {
  const { chainId } = useActiveWeb3React()
  const amp = new Fraction(poolData.amp).divide(JSBI.BigInt(SUBGRAPH_AMP_MULTIPLIER))
  const ampLiquidity = formattedNum(`${parseFloat(amp.toSignificant(5)) * parseFloat(poolData.reserveUSD)}`, true)
  return (
    <>
      <ItemCardInfoRow name={t`AMP Liquidity`} value={ampLiquidity as string} infoHelperText={AMP_LIQUIDITY_HINT} />
      <ItemCardInfoRowPriceRange poolData={poolData} />
      <ItemCardInfoRow
        infoHelperText={
          chainId && ONLY_STATIC_FEE_CHAINS[chainId]
            ? t`Liquidity providers will earn this trading fee for each trade that uses this pool`
            : undefined
        }
        name={poolData.fee ? t`Fee` : t`Fee Range`}
        value={poolData.fee ? poolData.fee / 1000 + '%' : feeRangeCalc(+amp.toSignificant(5))}
      />
    </>
  )
}
