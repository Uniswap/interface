import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { validColor } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useNetworkColors } from 'uniswap/src/utils/colors'

export function BuyNativeTokenButton({
  nativeCurrencyInfo,
  onPress,
  usesStaticText,
  usesStaticTheme,
}: {
  nativeCurrencyInfo: CurrencyInfo
  onPress?: () => void
  usesStaticText?: boolean
  usesStaticTheme?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const { foreground, background } = useNetworkColors(nativeCurrencyInfo.currency?.chainId ?? defaultChainId)
  const textColorFromChain = validColor(foreground)
  const backgroundColorFromChain = validColor(background)

  const { navigateToFiatOnRamp } = useUniswapContext()
  const { currency: fiatOnRampCurrency } = useIsSupportedFiatOnRampCurrency(
    nativeCurrencyInfo?.currencyId ?? '',
    !nativeCurrencyInfo,
  )

  const onPressBuyFiatOnRamp = (): void => {
    navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency })
    onPress?.()
  }

  return (
    <Trace logPress element={ElementName.BuyNativeTokenButton}>
      <Flex row alignSelf="stretch">
        <Button
          backgroundColor={usesStaticTheme ? undefined : backgroundColorFromChain}
          borderColor="$transparent"
          size="medium"
          emphasis={usesStaticTheme ? 'secondary' : 'primary'}
          onPress={onPressBuyFiatOnRamp}
        >
          <Button.Text color={usesStaticTheme ? undefined : textColorFromChain}>
            {usesStaticText
              ? t('swap.warning.insufficientGas.button.buyWithCard')
              : t('swap.warning.insufficientGas.button.buy', { tokenSymbol: nativeCurrencyInfo.currency.symbol ?? '' })}
          </Button.Text>
        </Button>
      </Flex>
    </Trace>
  )
}
