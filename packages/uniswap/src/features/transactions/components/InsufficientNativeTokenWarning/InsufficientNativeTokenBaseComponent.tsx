import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/constants'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { GasInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRow'
import { useDebouncedGasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/useDebouncedGasInfo'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { isExtension, isWeb } from 'utilities/src/platform'

export function InsufficientNativeTokenBaseComponent({
  parsedInsufficientNativeTokenWarning,
}: {
  parsedInsufficientNativeTokenWarning: NonNullable<ReturnType<typeof useInsufficientNativeTokenWarning>>
}): JSX.Element | null {
  const priceUXEnabled = usePriceUXEnabled()

  const debouncedGasInfo = useDebouncedGasInfo()

  const { nativeCurrency, networkColors, networkName, flow } = parsedInsufficientNativeTokenWarning

  const currencySymbol = nativeCurrency.symbol

  const shouldShowNetworkName = nativeCurrency.symbol === 'ETH' && nativeCurrency.chainId !== UniverseChainId.Mainnet

  const textComponentWithNetworkColor = (
    <Text style={{ color: networkColors.foreground }} variant={INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT} />
  )

  return (
    <Flex centered row borderRadius="$rounded12" gap="$spacing8" p={isWeb ? '$spacing16' : '$none'}>
      {isWeb && (
        <Flex>
          <AlertTriangleFilled color="$neutral2" size="$icon.16" />
        </Flex>
      )}

      <Flex fill={isWeb}>
        <Text color="$neutral2" variant={INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT}>
          {shouldShowNetworkName ? (
            flow === 'swap' ? (
              <Trans
                components={{
                  highlight: textComponentWithNetworkColor,
                }}
                i18nKey="swap.warning.insufficientGas.message.withNetwork"
                values={{
                  currencySymbol,
                  networkName,
                }}
              />
            ) : (
              <Trans
                components={{
                  highlight: textComponentWithNetworkColor,
                }}
                i18nKey="send.warning.insufficientGas.message.withNetwork"
                values={{
                  currencySymbol,
                  networkName,
                }}
              />
            )
          ) : flow === 'swap' ? (
            <Trans
              components={{
                highlight: textComponentWithNetworkColor,
              }}
              i18nKey="swap.warning.insufficientGas.message.withoutNetwork"
              values={{ currencySymbol }}
            />
          ) : (
            <Trans
              components={{
                highlight: textComponentWithNetworkColor,
              }}
              i18nKey="send.warning.insufficientGas.message.withoutNetwork"
              values={{ currencySymbol }}
            />
          )}
        </Text>
      </Flex>
      {priceUXEnabled && (isWeb || isExtension) && <GasInfoRow gasInfo={debouncedGasInfo} />}

      {!isWeb && (
        <Flex>
          <InfoCircle color="$neutral3" size="$icon.16" />
        </Flex>
      )}
    </Flex>
  )
}
