import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { iconSizes, Text } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { CollapsibleCellLayout } from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import { BIPS_BASE } from '~/constants/misc'

// Helper function to get fee label from position
function getFeeLabel(position: PositionInfo, t: ReturnType<typeof useTranslation>['t']): string {
  if (position.version === ProtocolVersion.V2) {
    return `${V2_DEFAULT_FEE_TIER / BIPS_BASE}%`
  }
  const feeTier = 'feeTier' in position ? position.feeTier : undefined
  if (feeTier) {
    if (feeTier.isDynamic) {
      return t('common.dynamic')
    }
    return `${feeTier.feeAmount / BIPS_BASE}%`
  }
  return `${V2_DEFAULT_FEE_TIER / BIPS_BASE}%`
}

// First column cell component - Pool info with SplitLogo, symbols, percent and version
export const PoolInfoCell = memo(function PoolInfoCell({ position }: { position: PositionInfo }) {
  const { t } = useTranslation()
  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(position.currency0Amount.currency),
    currencyId(position.currency1Amount.currency),
  ])
  const [baseInfo, quoteInfo] = orderPoolDataByQuoteToken({
    token0IsQuote: position.isToken0Quote,
    data0: currency0Info,
    data1: currency1Info,
  })
  const poolName = getPoolName({
    symbol0: position.currency0Amount.currency.symbol,
    symbol1: position.currency1Amount.currency.symbol,
    token0IsQuote: position.isToken0Quote,
    spaced: true,
  })

  if (!baseInfo || !quoteInfo) {
    return null
  }

  const getVersionText = () => {
    return ProtocolVersion[position.version].toLowerCase()
  }

  return (
    <CollapsibleCellLayout
      gapPx={8}
      logo={
        <SplitLogo
          inputCurrencyInfo={baseInfo}
          outputCurrencyInfo={quoteInfo}
          size={iconSizes.icon32}
          chainId={position.chainId}
        />
      }
    >
      <Text variant="body3" color="$neutral1" numberOfLines={1}>
        {poolName}
      </Text>
      <Text variant="body4" color="$neutral2" numberOfLines={1}>
        {getFeeLabel(position, t)} • {getVersionText()}
      </Text>
    </CollapsibleCellLayout>
  )
})
PoolInfoCell.displayName = 'PoolInfoCell'
