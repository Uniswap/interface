import { FeeAmount } from '@uniswap/v3-sdk'
import { AutoColumn } from 'components/deprecated/Column'
import { FEE_AMOUNT_DETAIL } from 'components/FeeSelector/shared'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import { Trans } from 'react-i18next'
import { Flex, RadioButton, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

interface FeeOptionProps {
  feeAmount: FeeAmount
  selected: boolean
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
  onClick: () => void
}

export function FeeOption({ feeAmount, selected, poolState, distributions, onClick }: FeeOptionProps) {
  const { formatPercent } = useLocalizationContext()
  const pct = distributions?.[feeAmount]?.toFixed(0)
  const tooltipText = FEE_AMOUNT_DETAIL[feeAmount].description

  return (
    <MouseoverTooltip disabled={!tooltipText} text={tooltipText} size={TooltipSize.Max} placement="auto">
      <Flex
        alignItems="flex-start"
        py="$padding12"
        px="$padding8"
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        borderColor={selected ? '$accent1' : '$surface3'}
        focusStyle={{
          shadowColor: '$surface3',
          shadowRadius: '$spacing1',
        }}
        pressStyle={{
          shadowColor: '$surface3',
          shadowRadius: '$spacing1',
        }}
        hoverStyle={{
          shadowColor: '$neutral3',
          shadowRadius: '$spacing1',
        }}
        disabledStyle={{
          opacity: 0.5,
          cursor: 'auto',
        }}
      >
        <RadioButton
          position="absolute"
          top="$spacing8"
          right="$spacing8"
          value={feeAmount.toString()}
          onPress={onClick}
          variant="branded"
        />
        <AutoColumn gap="sm" justify="flex-start">
          <Text variant="buttonLabel3">{formatPercent(parseFloat(FEE_AMOUNT_DETAIL[feeAmount].label))}</Text>

          {distributions && (
            <Text variant="body4" color="$neutral2">
              {poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID ? (
                <Trans i18nKey="common.notCreated.label" />
              ) : distributions[feeAmount] !== undefined ? (
                <Trans i18nKey="fee.selectPercent" values={{ pct }} />
              ) : (
                <Trans i18nKey="common.noData" />
              )}
            </Text>
          )}
        </AutoColumn>
      </Flex>
    </MouseoverTooltip>
  )
}
