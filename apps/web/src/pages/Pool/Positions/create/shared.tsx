// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { MouseoverTooltip } from 'components/Tooltip'
import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { PriceRangeInfo } from 'pages/Pool/Positions/create/types'
import { Flex, GeneratedIcon, Text, TouchableArea, styled } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'

export const Container = styled(Flex, {
  gap: 32,
  p: '$spacing24',
  borderRadius: '$rounded20',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  overflow: 'hidden',
  width: '100%',
})

export function AdvancedButton({
  title,
  tooltipText,
  Icon,
  onPress,
}: {
  title: string
  tooltipText?: string
  Icon: GeneratedIcon
  onPress: () => void
}) {
  const { t } = useTranslation()
  return (
    <Flex row gap="$spacing8" alignItems="center">
      <Flex row gap="$spacing4" alignItems="center">
        <Icon size={iconSizes.icon16} color="$neutral2" />
        <Text
          variant="body3"
          color="$neutral2"
          textDecorationLine="underline"
          textDecorationStyle="dashed"
          cursor="pointer"
          onPress={onPress}
        >
          {title}
        </Text>
      </Flex>
      <Text variant="body3" color="$neutral3">
        ({t('common.advanced')})
      </Text>
      {tooltipText && (
        <MouseoverTooltip text={tooltipText} placement="auto">
          <InfoCircleFilled size={iconSizes.icon16} color="$neutral3" />
        </MouseoverTooltip>
      )}
    </Flex>
  )
}

export function CreatingPoolInfo() {
  const { derivedPositionInfo, createPoolInfoDismissed, setCreatePoolInfoDismissed } = useCreatePositionContext()

  const previouslyCreatingPoolOrPair = usePrevious(derivedPositionInfo.creatingPoolOrPair)

  const shouldShowDisabled = previouslyCreatingPoolOrPair && derivedPositionInfo.poolOrPairLoading

  if ((!shouldShowDisabled && !derivedPositionInfo.creatingPoolOrPair) || createPoolInfoDismissed) {
    return null
  }

  return (
    <Container row gap="$spacing12" opacity={shouldShowDisabled ? 0.4 : 1}>
      <InfoCircleFilled flexShrink={0} size={iconSizes.icon20} color="$neutral2" />
      <Flex flexWrap="wrap" flexShrink={1}>
        <Text variant="subheading1">
          <Trans i18nKey="pool.create" />
        </Text>
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="pool.create.info" />
        </Text>
      </Flex>
      <TouchableArea onPress={() => setCreatePoolInfoDismissed(true)}>
        <X flexShrink={0} size={iconSizes.icon20} color="$neutral2" />
      </TouchableArea>
    </Container>
  )
}

export function formatPrices(
  derivedPriceRangeInfo: PriceRangeInfo,
  formatter: (input: FormatNumberOrStringInput) => string,
) {
  if (derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2) {
    return ['', '']
  }

  const { ticksAtLimit, isSorted, prices } = derivedPriceRangeInfo

  const lowerPriceFormatted = ticksAtLimit[isSorted ? 0 : 1]
    ? '0'
    : formatter({ value: prices?.[0]?.toSignificant(), type: NumberType.TokenTx })
  const upperPriceFormatted = ticksAtLimit[isSorted ? 1 : 0]
    ? '∞'
    : formatter({ value: prices?.[1]?.toSignificant(), type: NumberType.TokenTx })

  return [lowerPriceFormatted, upperPriceFormatted]
}
