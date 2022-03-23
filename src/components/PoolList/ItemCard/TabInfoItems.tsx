import ItemCardInfoRow from 'components/PoolList/ItemCard/ItemCardInfoRow'
import { t } from '@lingui/macro'
import { MAX_ALLOW_APY } from 'constants/index'
import { getMyLiquidity, getTradingFeeAPR } from 'utils/dmm'
import React from 'react'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum } from 'utils'

export default function TabInfoItems({
  poolData,
  myLiquidity,
}: {
  poolData: SubgraphPoolData
  myLiquidity: UserLiquidityPosition | undefined
}) {
  const volume = poolData?.oneDayVolumeUSD ? poolData?.oneDayVolumeUSD : poolData?.oneDayVolumeUntracked
  const fee = poolData?.oneDayFeeUSD ? poolData?.oneDayFeeUSD : poolData?.oneDayFeeUntracked
  const totalValueLocked = formattedNum(`${parseFloat(poolData?.reserveUSD)}`, true)
  const oneYearFL = getTradingFeeAPR(poolData?.reserveUSD, fee).toFixed(2)

  return (
    <>
      <ItemCardInfoRow name={t`Total Value Locked`} value={totalValueLocked as string} />
      <ItemCardInfoRow
        name={t`APR`}
        value={Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'}
        infoHelperText={t`Estimated return based on yearly fees of the pool`}
      />
      <ItemCardInfoRow name={t`Volume (24H)`} value={volume} />
      <ItemCardInfoRow name={t`Fees (24H)`} value={fee} />
      <ItemCardInfoRow name={t`Your Liquidity Balance`} value={getMyLiquidity(myLiquidity)} />
    </>
  )
}
