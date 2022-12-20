import { Trans, t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import { ClassicFarmingPoolAPRCell } from 'components/YieldPools/FarmingPoolAPRCell'
import { MAX_ALLOW_APY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useActiveAndUniqueFarmsData } from 'state/farms/hooks'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { formattedNum } from 'utils'
import { getMyLiquidity, getTradingFeeAPR } from 'utils/dmm'

import ItemCardInfoRow, { Field, Value } from './ItemCardInfoRow'

export default function TabInfoItems({
  poolData,
  myLiquidity,
}: {
  poolData: SubgraphPoolData
  myLiquidity: UserLiquidityPosition | undefined
}) {
  const theme = useTheme()
  const volume = poolData?.oneDayVolumeUSD ? poolData?.oneDayVolumeUSD : poolData?.oneDayVolumeUntracked
  const fee = poolData?.oneDayFeeUSD ? poolData?.oneDayFeeUSD : poolData?.oneDayFeeUntracked
  const totalValueLocked = formattedNum(`${parseFloat(poolData?.reserveUSD)}`, true)
  const oneYearFL = getTradingFeeAPR(poolData?.reserveUSD, fee).toFixed(2)

  const { data: uniqueAndActiveFarms } = useActiveAndUniqueFarmsData()
  const farm = uniqueAndActiveFarms.find(f => f.id.toLowerCase() === poolData.id.toLowerCase())
  const isFarmingPool = !!farm

  const renderAPR = () => {
    if (Number(oneYearFL) > MAX_ALLOW_APY) {
      return '--'
    }

    if (isFarmingPool) {
      return <ClassicFarmingPoolAPRCell poolAPR={Number(oneYearFL)} farm={farm} />
    }

    return <Value>{oneYearFL}%</Value>
  }

  return (
    <>
      <ItemCardInfoRow name={t`Total Value Locked`} value={totalValueLocked as string} />
      <Flex justifyContent="space-between">
        <Field>
          <Flex>
            <Text>
              <Trans>APR</Trans>
            </Text>
            <InfoHelper text={t`Estimated return based on yearly fees of the pool`} />
          </Flex>
        </Field>
        <Flex
          alignItems="center"
          sx={{ gap: '4px', fontSize: '12px', fontWeight: 400, color: theme.text, lineHeight: '24px' }}
        >
          {renderAPR()}
        </Flex>
      </Flex>
      <ItemCardInfoRow name={t`Volume (24H)`} value={formattedNum(volume, true)} />
      <ItemCardInfoRow name={t`Fees (24H)`} value={formattedNum(fee, true)} />
      <ItemCardInfoRow name={t`Your Liquidity Balance`} value={getMyLiquidity(myLiquidity)} />
    </>
  )
}
