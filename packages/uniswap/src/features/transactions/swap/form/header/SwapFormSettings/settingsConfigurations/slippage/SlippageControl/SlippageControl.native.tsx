import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SlippageControlProps } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/SlippageControl/types'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/useSlippageSettings'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function SlippageControl(_props: SlippageControlProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const { derivedSwapInfo } = useSwapFormContext()
  const isBridgeTrade = derivedSwapInfo.trade.trade instanceof BridgeTrade
  const { currentSlippageTolerance, autoSlippageEnabled } = useSlippageSettings({ isBridgeTrade })

  return (
    <Flex row gap="$spacing8">
      {autoSlippageEnabled && !isBridgeTrade ? (
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
