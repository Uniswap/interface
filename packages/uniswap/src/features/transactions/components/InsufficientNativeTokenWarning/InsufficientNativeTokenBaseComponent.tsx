import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Gas } from 'ui/src/components/icons/Gas'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/constants'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { isExtensionApp, isWebPlatform } from 'utilities/src/platform'

export function InsufficientNativeTokenBaseComponent({
  parsedInsufficientNativeTokenWarning,
  gasFee,
}: {
  parsedInsufficientNativeTokenWarning: NonNullable<ReturnType<typeof useInsufficientNativeTokenWarning>>
  gasFee: GasFeeResult
}): JSX.Element | null {
  const { nativeCurrency, networkColors, networkName, flow } = parsedInsufficientNativeTokenWarning

  const currencySymbol = nativeCurrency.symbol

  const shouldShowNetworkName = nativeCurrency.symbol === 'ETH' && nativeCurrency.chainId !== UniverseChainId.Mainnet

  const textComponentWithNetworkColor = (
    <Text style={{ color: networkColors.foreground }} variant={INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT} />
  )

  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId: nativeCurrency.chainId,
    placeholder: undefined,
  })

  return (
    <Flex centered row borderRadius="$rounded12" gap="$spacing8" p={isWebPlatform ? '$spacing16' : '$none'}>
      <Flex>
        <AlertTriangleFilled color="$neutral2" size="$icon.16" />
      </Flex>

      <Flex fill={isWebPlatform}>
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
      {gasFeeFormatted && (isWebPlatform || isExtensionApp) && (
        <NetworkFeeWarning
          chainId={nativeCurrency.chainId}
          placement="bottom"
          tooltipTrigger={
            <Flex row gap="$spacing4">
              <Gas color="$neutral2" size="$icon.16" />
              <Text color="$neutral2" variant="body3">
                {gasFeeFormatted}
              </Text>
            </Flex>
          }
        />
      )}

      {!isWebPlatform && (
        <Flex>
          <InfoCircle color="$neutral3" size="$icon.16" />
        </Flex>
      )}
    </Flex>
  )
}
