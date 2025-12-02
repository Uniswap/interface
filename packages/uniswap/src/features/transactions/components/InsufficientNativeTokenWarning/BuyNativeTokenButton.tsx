import { useTranslation } from 'react-i18next'
import { Button, Flex } from 'ui/src'
import { validColor } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
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
}): JSX.Element | null {
  const { t } = useTranslation()
  const { foreground, background } = useNetworkColors(nativeCurrencyInfo.currency.chainId)
  const textColorFromChain = validColor(foreground)
  const backgroundColorFromChain = validColor(background)

  const { navigateToFiatOnRamp } = useUniswapContext()
  const { currency: fiatOnRampCurrency, isLoading } = useIsSupportedFiatOnRampCurrency(
    nativeCurrencyInfo.currencyId,
    !nativeCurrencyInfo,
  )

  // TODO: SWAP-794 When Fiat On Ramp is supported for Monad, remove this check
  const fiatOnRampCurrencyNotSupportedForMonad = nativeCurrencyInfo.currency.chainId === UniverseChainId.Monad

  const onPressBuyFiatOnRamp = (): void => {
    onPress?.()
    navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency })
  }

  if ((!isLoading && !fiatOnRampCurrency) || fiatOnRampCurrencyNotSupportedForMonad) {
    return null
  }

  const isDisabled = isLoading || !fiatOnRampCurrency
  const useStaticEmphasis = usesStaticTheme || isDisabled
  const backgroundColor = useStaticEmphasis ? undefined : backgroundColorFromChain
  const textColor = useStaticEmphasis ? undefined : textColorFromChain
  const emphasis = useStaticEmphasis ? 'secondary' : 'primary'

  return (
    <Trace logPress element={ElementName.BuyNativeTokenButton}>
      <Flex row alignSelf="stretch">
        <Button
          isDisabled={isDisabled}
          backgroundColor={backgroundColor}
          borderColor="$transparent"
          size="medium"
          emphasis={emphasis}
          onPress={onPressBuyFiatOnRamp}
        >
          <Button.Text color={textColor}>
            {usesStaticText
              ? t('swap.warning.insufficientGas.button.buyWithCard')
              : t('swap.warning.insufficientGas.button.buy', { tokenSymbol: nativeCurrencyInfo.currency.symbol ?? '' })}
          </Button.Text>
        </Button>
      </Flex>
    </Trace>
  )
}
