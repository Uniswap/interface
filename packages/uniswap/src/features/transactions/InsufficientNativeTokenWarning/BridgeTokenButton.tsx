import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, isWeb } from 'ui/src'
import { opacify, validColor } from 'ui/src/theme'
import { AssetType } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getDefaultState, useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'

export function BridgeTokenButton({
  inputToken,
  outputToken,
  outputNetworkName,
}: {
  inputToken: CurrencyInfo
  outputToken: CurrencyInfo
  outputNetworkName: string
}): JSX.Element {
  const { t } = useTranslation()
  const { foreground, background } = useNetworkColors(outputToken.currency?.chainId ?? UniverseChainId.Mainnet)
  const primaryColor = validColor(foreground)
  const backgroundColor = validColor(background)
  const onPressColor = validColor(opacify(50, foreground))

  const { defaultChainId } = useEnabledChains()
  const { updateSwapForm } = useSwapFormContext()

  const onPressBridgeToken = useCallback((): void => {
    updateSwapForm({
      ...getDefaultState(defaultChainId),
      input: {
        address: currencyIdToAddress(inputToken.currencyId),
        chainId: inputToken.currency.chainId,
        type: AssetType.Currency,
      },
      output: {
        address: currencyIdToAddress(outputToken.currencyId),
        chainId: outputToken.currency.chainId,
        type: AssetType.Currency,
      },
    })
  }, [
    defaultChainId,
    inputToken.currency.chainId,
    inputToken.currencyId,
    outputToken.currency.chainId,
    outputToken.currencyId,
    updateSwapForm,
  ])

  if (!outputToken.currency.symbol) {
    throw new Error(
      'Unexpected render of `BridgeTokenButton` without a token symbol for currency ' + outputToken.currencyId,
    )
  }

  return (
    <Trace logPress element={ElementName.BuyNativeTokenButton}>
      <Button
        backgroundColor={backgroundColor}
        color={primaryColor}
        pressStyle={{ backgroundColor: onPressColor }}
        size={isWeb ? 'small' : 'medium'}
        theme="primary"
        width="100%"
        onPress={onPressBridgeToken}
      >
        {t('swap.warning.insufficientGas.button.bridge', {
          tokenSymbol: outputToken.currency.symbol,
          networkName: outputNetworkName,
        })}
      </Button>
    </Trace>
  )
}
