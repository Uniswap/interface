import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'

export function SlippageControl(props: SlippageControlProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const isZeroSlippage = props.isZeroSlippage
  const { currentSlippageTolerance, autoSlippageEnabled } = useSlippageSettings({
    saveOnBlur: props.saveOnBlur,
    isZeroSlippage: props.isZeroSlippage,
  })

  return (
    <Flex row gap="$spacing8">
      {autoSlippageEnabled && !isZeroSlippage ? (
        <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
          <Text color="$accent1" variant="buttonLabel3">
            {t('swap.settings.slippage.control.auto')}
          </Text>
        </Flex>
      ) : null}
      <Text color="$neutral2" variant="subheading2">
        {formatPercent(currentSlippageTolerance)}
      </Text>
    </Flex>
  )
}
