import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { MouseoverTooltip } from 'components/Tooltip'
import { useLpIncentivesFormattedEarnings } from 'hooks/useLpIncentivesFormattedEarnings'
import { EmptyTableCell } from 'pages/Portfolio/EmptyTableCell'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

// Third column cell component - Fees in USD
export const PoolFeesCell = memo(function PoolFeesCell({ position }: { position: PositionInfo }) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const fiatFeeValue0 = useUSDCValue(position.fee0Amount, PollingInterval.Slow)
  const fiatFeeValue1 = useUSDCValue(position.fee1Amount, PollingInterval.Slow)

  const { totalFeesFiatValue } = useLpIncentivesFormattedEarnings({
    liquidityPosition: position,
    fiatFeeValue0,
    fiatFeeValue1,
  })

  // For V2 positions, fees may not be available
  const isV2AndUnavailable = position.version === ProtocolVersion.V2 && !totalFeesFiatValue

  if (isV2AndUnavailable) {
    return (
      <Flex row gap="$gap4" alignItems="center">
        <Text variant="body2" color="$neutral2">
          {t('common.unavailable')}
        </Text>
        <MouseoverTooltip text={t('fee.unavailable')} placement="auto">
          <Flex justifyContent="center">
            <InfoCircleFilled color="$neutral2" size="$icon.16" />
          </Flex>
        </MouseoverTooltip>
      </Flex>
    )
  }

  if (!totalFeesFiatValue) {
    return <EmptyTableCell />
  }

  return (
    <Text variant="body3" color="$neutral1">
      {convertFiatAmountFormatted(totalFeesFiatValue.toExact(), NumberType.FiatRewards)}
    </Text>
  )
})
PoolFeesCell.displayName = 'PoolFeesCell'
