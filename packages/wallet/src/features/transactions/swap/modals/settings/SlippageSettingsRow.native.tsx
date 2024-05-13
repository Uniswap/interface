import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'wallet/src/constants/transactions'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { SlippageSettingsRowProps } from 'wallet/src/features/transactions/swap/modals/settings/SlippageSettingsRowProps'

export function SlippageSettingsRow({
  derivedSwapInfo,
  onPress,
}: SlippageSettingsRowProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const { customSlippageTolerance, autoSlippageTolerance } = derivedSwapInfo
  const isCustomSlippage = !!customSlippageTolerance
  const currentSlippage =
    customSlippageTolerance ?? autoSlippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE

  return (
    <Flex row justifyContent="space-between">
      <Text color="$neutral1" variant="subheading2">
        {t('swap.settings.slippage.control.title')}
      </Text>
      <TouchableArea onPress={onPress}>
        <Flex row gap="$spacing8">
          {!isCustomSlippage ? (
            <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
              <Text color="$accent1" variant="buttonLabel4">
                {t('swap.settings.slippage.control.auto')}
              </Text>
            </Flex>
          ) : null}
          <Text color="$neutral2" variant="subheading2">
            {formatPercent(currentSlippage)}
          </Text>
          <RotatableChevron
            color="$neutral3"
            direction="end"
            height={iconSizes.icon24}
            width={iconSizes.icon24}
          />
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
