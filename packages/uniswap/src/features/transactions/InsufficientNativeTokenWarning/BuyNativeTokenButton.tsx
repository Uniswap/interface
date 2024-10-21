import { useTranslation } from 'react-i18next'
import { Button, isWeb } from 'ui/src'
import { opacify, validColor } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useNetworkColors } from 'uniswap/src/utils/colors'

export function BuyNativeTokenButton({
  nativeCurrencyInfo,
  canBridge,
}: {
  nativeCurrencyInfo: CurrencyInfo
  canBridge: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const { foreground, background } = useNetworkColors(nativeCurrencyInfo.currency?.chainId ?? defaultChainId)
  const primaryColor = validColor(foreground)
  const backgroundColor = validColor(background)
  const onPressColor = validColor(opacify(50, foreground))

  const { navigateToFiatOnRamp } = useUniswapContext()
  const fiatOnRampCurrency = useIsSupportedFiatOnRampCurrency(nativeCurrencyInfo?.currencyId ?? '', !nativeCurrencyInfo)

  const onPressBuyFiatOnRamp = (): void => {
    navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency })
  }

  return (
    <Trace logPress element={ElementName.BuyNativeTokenButton}>
      <Button
        {...(canBridge
          ? undefined
          : {
              backgroundColor,
              color: primaryColor,
              pressStyle: { backgroundColor: onPressColor },
            })}
        size={isWeb ? 'small' : 'medium'}
        theme={canBridge ? 'secondary' : 'primary'}
        width="100%"
        onPress={onPressBuyFiatOnRamp}
      >
        {canBridge
          ? t('swap.warning.insufficientGas.button.buyWithCard')
          : t('swap.warning.insufficientGas.button.buy', { tokenSymbol: nativeCurrencyInfo.currency.symbol })}
      </Button>
    </Trace>
  )
}
