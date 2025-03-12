import { useTranslation } from 'react-i18next'
import { Button, Flex, isWeb } from 'ui/src'
import { validColor } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useNetworkColors } from 'uniswap/src/utils/colors'

export function BridgeTokenButton({
  inputToken,
  outputToken,
  outputNetworkName,
  onPress,
}: {
  inputToken: CurrencyInfo
  outputToken: CurrencyInfo
  outputNetworkName: string
  onPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { foreground, background } = useNetworkColors(outputToken.currency?.chainId ?? UniverseChainId.Mainnet)
  const primaryColor = validColor(foreground)
  const backgroundColor = validColor(background)

  const { navigateToSwapFlow } = useUniswapContext()

  const onPressBridgeToken = (): void => {
    onPress?.()
    navigateToSwapFlow({
      inputCurrencyId: inputToken.currencyId,
      outputCurrencyId: outputToken.currencyId,
    })
  }

  if (!outputToken.currency.symbol) {
    throw new Error(
      'Unexpected render of `BridgeTokenButton` without a token symbol for currency ' + outputToken.currencyId,
    )
  }

  return (
    <Trace logPress element={ElementName.BuyNativeTokenButton}>
      <Flex row alignSelf="stretch">
        <Button
          backgroundColor={backgroundColor}
          borderColor="$transparent"
          hoverStyle={{
            borderColor: primaryColor,
          }}
          size={isWeb ? 'medium' : 'large'}
          emphasis="text-only"
          primary-color={primaryColor}
          onPress={onPressBridgeToken}
        >
          <Button.Text customBackgroundColor={backgroundColor} color={primaryColor}>
            {t('swap.warning.insufficientGas.button.bridge', {
              tokenSymbol: outputToken.currency.symbol,
              networkName: outputNetworkName,
            })}
          </Button.Text>
        </Button>
      </Flex>
    </Trace>
  )
}
