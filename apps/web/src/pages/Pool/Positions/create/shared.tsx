import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { MouseoverTooltip } from 'components/Tooltip'
import { PriceRangeInfo } from 'pages/Pool/Positions/create/types'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, GeneratedIcon, Text, styled } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { iconSizes } from 'ui/src/theme'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'

export const Container = styled(Flex, {
  gap: 32,
  p: '$spacing24',
  borderRadius: '$rounded20',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  overflow: 'hidden',
  width: '100%',
  $lg: {
    p: '$spacing16',
  },
})

export function AdvancedButton({
  title,
  tooltipText,
  Icon,
  onPress,
  elementName,
}: {
  title: string
  tooltipText?: string
  Icon: GeneratedIcon
  onPress: () => void
  elementName?: ElementNameType
}) {
  const { t } = useTranslation()
  return (
    <Flex row gap="$spacing8" alignItems="center">
      <Flex row gap="$spacing4" alignItems="center">
        <Icon size={iconSizes.icon16} color="$neutral2" />
        <Trace logPress={!!elementName} element={elementName}>
          <Text
            variant="body3"
            color="$neutral2"
            textDecorationLine="underline"
            textDecorationStyle="dashed"
            onPress={onPress}
            {...ClickableTamaguiStyle}
          >
            {title}
          </Text>
        </Trace>
      </Flex>
      <Text variant="body3" color="$neutral3">
        ({t('common.advanced')})
      </Text>
      {tooltipText && (
        <MouseoverTooltip text={tooltipText} placement="auto" style={{ maxHeight: '16px' }}>
          <Flex>
            <InfoCircleFilled size={iconSizes.icon16} color="$neutral3" />
          </Flex>
        </MouseoverTooltip>
      )}
    </Flex>
  )
}

export function formatPrices(
  derivedPriceRangeInfo: PriceRangeInfo,
  formatter: (input: FormatNumberOrStringInput) => string,
): {
  formattedPrices: [string, string]
  isFullRange: boolean
} {
  if (derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2) {
    return { formattedPrices: ['', ''], isFullRange: true }
  }

  const { ticksAtLimit, isSorted, prices, invertPrice } = derivedPriceRangeInfo

  const isLowerAtLimit = ticksAtLimit[isSorted ? 0 : 1]
  const [lowerPrice, upperPrice] = isSorted ? [prices?.[0], prices?.[1]] : [prices?.[1], prices?.[0]]

  const lowerPriceFormatted = isLowerAtLimit
    ? '0'
    : formatter({
        value: (invertPrice ? lowerPrice?.invert() : lowerPrice)?.toSignificant(),
        type: NumberType.TokenTx,
      })

  const isUpperAtLimit = ticksAtLimit[isSorted ? 1 : 0]
  const upperPriceFormatted = isUpperAtLimit
    ? '∞'
    : formatter({
        value: (invertPrice ? upperPrice?.invert() : upperPrice)?.toSignificant(),
        type: NumberType.TokenTx,
      })

  return { formattedPrices: [lowerPriceFormatted, upperPriceFormatted], isFullRange: isLowerAtLimit && isUpperAtLimit }
}
