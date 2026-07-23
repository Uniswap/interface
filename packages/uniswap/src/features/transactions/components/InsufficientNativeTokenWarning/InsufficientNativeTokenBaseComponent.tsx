import { isWebPlatform } from '@universe/environment'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/constants'
import { type useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'

export function InsufficientNativeTokenBaseComponent({
  parsedInsufficientNativeTokenWarning,
}: {
  parsedInsufficientNativeTokenWarning: NonNullable<ReturnType<typeof useInsufficientNativeTokenWarning>>
}): JSX.Element | null {
  const { nativeCurrency, networkColors, networkName, flow } = parsedInsufficientNativeTokenWarning

  const currencySymbol = nativeCurrency.symbol

  const shouldShowNetworkName = nativeCurrency.symbol === 'ETH' && nativeCurrency.chainId !== UniverseChainId.Mainnet

  const textComponentWithNetworkColor = (
    <Text
      key="highlight"
      style={{ color: networkColors.foreground }}
      variant={INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT}
    />
  )

  return (
    <Flex
      centered
      row
      backgroundColor={isWebPlatform ? '$surface2' : 'transparent'}
      borderRadius="$rounded12"
      gap="$spacing8"
      p={isWebPlatform ? '$spacing16' : '$none'}
    >
      <Flex>
        <AlertTriangleFilled color="$neutral2" size="$icon.16" />
      </Flex>

      <Flex fill={isWebPlatform}>
        <Text color="$neutral2" variant={INSUFFICIENT_NATIVE_TOKEN_TEXT_VARIANT}>
          <InsufficientGasMessage
            currencySymbol={currencySymbol}
            flow={flow}
            networkName={networkName}
            shouldShowNetworkName={shouldShowNetworkName}
            textComponentWithNetworkColor={textComponentWithNetworkColor}
          />
        </Text>
      </Flex>

      {!isWebPlatform && (
        <Flex>
          <InfoCircle color="$neutral3" size="$icon.16" />
        </Flex>
      )}
    </Flex>
  )
}

function InsufficientGasMessage({
  currencySymbol,
  flow,
  networkName,
  shouldShowNetworkName,
  textComponentWithNetworkColor,
}: {
  currencySymbol: string | undefined
  flow: NonNullable<ReturnType<typeof useInsufficientNativeTokenWarning>>['flow']
  networkName: string
  shouldShowNetworkName: boolean
  textComponentWithNetworkColor: JSX.Element
}): JSX.Element {
  const components = {
    highlight: textComponentWithNetworkColor,
  }
  const values = {
    currencySymbol,
    networkName,
  }

  if (flow === 'deposit') {
    return shouldShowNetworkName ? (
      <Trans
        components={components}
        i18nKey="explore.earn.warning.insufficientGas.message.withNetwork.deposit"
        values={values}
      />
    ) : (
      <Trans
        components={components}
        i18nKey="explore.earn.warning.insufficientGas.message.withoutNetwork.deposit"
        values={values}
      />
    )
  }

  if (flow === 'withdraw') {
    return shouldShowNetworkName ? (
      <Trans
        components={components}
        i18nKey="explore.earn.warning.insufficientGas.message.withNetwork.withdraw"
        values={values}
      />
    ) : (
      <Trans
        components={components}
        i18nKey="explore.earn.warning.insufficientGas.message.withoutNetwork.withdraw"
        values={values}
      />
    )
  }

  if (flow === 'swap') {
    return shouldShowNetworkName ? (
      <Trans components={components} i18nKey="swap.warning.insufficientGas.message.withNetwork" values={values} />
    ) : (
      <Trans components={components} i18nKey="swap.warning.insufficientGas.message.withoutNetwork" values={values} />
    )
  }

  return shouldShowNetworkName ? (
    <Trans components={components} i18nKey="send.warning.insufficientGas.message.withNetwork" values={values} />
  ) : (
    <Trans components={components} i18nKey="send.warning.insufficientGas.message.withoutNetwork" values={values} />
  )
}
