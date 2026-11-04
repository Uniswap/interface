import { isWebPlatform } from '@universe/environment'
import { Button, Flex, validColor } from '@universe/mycelium'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
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
  const { foreground } = useNetworkColors(outputToken.currency.chainId)
  const primaryColor = validColor(foreground)
  // The hover border is the runtime network color, so it rides a custom property (web only: RN has no CSS vars or hover).
  const hoverBorderStyle = isWebPlatform ? ({ '--bridge-hover-border': primaryColor } as CSSProperties) : undefined

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
          backgroundColor="$accent1"
          borderColor="$transparent"
          className="hover:border-(color:--bridge-hover-border)"
          style={hoverBorderStyle}
          size="medium"
          emphasis="text-only"
          primary-color={primaryColor}
          onPress={onPressBridgeToken}
        >
          <Button.Text color="$white">
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
