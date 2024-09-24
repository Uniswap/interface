import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, isWeb } from 'ui/src'
import { opacify, validColor } from 'ui/src/theme'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useIsSupportedFiatOnRampCurrency } from 'wallet/src/features/fiatOnRamp/hooks'

export function BuyNativeTokenButton({ nativeCurrencyInfo }: { nativeCurrencyInfo: CurrencyInfo }): JSX.Element {
  const { t } = useTranslation()
  const { foreground, background } = useNetworkColors(nativeCurrencyInfo.currency?.chainId ?? UniverseChainId.Mainnet)
  const primaryColor = validColor(foreground)
  const backgroundColor = validColor(background)
  const onPressColor = validColor(opacify(50, foreground))

  const { navigateToFiatOnRamp } = useWalletNavigation()
  const fiatOnRampCurrency = useIsSupportedFiatOnRampCurrency(nativeCurrencyInfo?.currencyId ?? '', !nativeCurrencyInfo)

  const onPressBuyFiatOnRamp = (): void => {
    navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency })
  }

  return (
    <Trace logPress element={ElementName.BuyNativeTokenButton}>
      {isWeb ? (
        <Flex
          backgroundColor={backgroundColor}
          borderRadius="$rounded12"
          cursor="pointer"
          hoverStyle={{ backgroundColor: onPressColor }}
          px="$spacing16"
          py="$spacing8"
          onPress={onPressBuyFiatOnRamp}
        >
          <Text color={primaryColor} variant="buttonLabel3">
            {t('swap.warning.insufficientGas.button.buy', { tokenSymbol: nativeCurrencyInfo.currency.symbol })}
          </Text>
        </Flex>
      ) : (
        <Button
          backgroundColor={backgroundColor}
          color={primaryColor}
          pressStyle={{ backgroundColor: onPressColor }}
          size="medium"
          theme="primary"
          width="100%"
          onPress={onPressBuyFiatOnRamp}
        >
          {t('swap.warning.insufficientGas.button.buy', { tokenSymbol: nativeCurrencyInfo.currency.symbol })}
        </Button>
      )}
    </Trace>
  )
}
