import { t } from '@lingui/macro'
import React from 'react'

import ItemCardInfoRow from 'components/PoolList/ItemCard/ItemCardInfoRow'
import { MAX_ALLOW_APY } from 'constants/index'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum } from 'utils'
import { getMyLiquidity, getTradingFeeAPR } from 'utils/dmm'

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
        name="APR"
        value={Number(oneYearFL) > MAX_ALLOW_APY ? '--' : oneYearFL + '%'}
        infoHelperText={t`Estimated return based on yearly fees of the pool`}
      />
      <ItemCardInfoRow name={t`Volume (24H)`} value={formattedNum(volume, true)} />
      <ItemCardInfoRow name={t`Fees (24H)`} value={formattedNum(fee, true)} />
      <ItemCardInfoRow name={t`Your Liquidity Balance`} value={getMyLiquidity(myLiquidity)} />
    </>
  )
}
