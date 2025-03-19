import { useTranslation } from 'react-i18next'
import { Button, Flex, isWeb } from 'ui/src'
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
  canBridge,
  onPress,
}: {
  nativeCurrencyInfo: CurrencyInfo
  canBridge: boolean
  onPress?: () => void
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
          backgroundColor={canBridge ? undefined : backgroundColorFromChain}
          size={isWeb ? 'medium' : 'large'}
          emphasis={canBridge ? 'secondary' : 'primary'}
          onPress={onPressBuyFiatOnRamp}
        >
          {canBridge ? (
            t('swap.warning.insufficientGas.button.buyWithCard')
          ) : (
            <Button.Text color={textColorFromChain}>
              {t('swap.warning.insufficientGas.button.buy', { tokenSymbol: nativeCurrencyInfo.currency.symbol ?? '' })}
            </Button.Text>
          )}
        </Button>
      </Flex>
    </Trace>
  )
}
