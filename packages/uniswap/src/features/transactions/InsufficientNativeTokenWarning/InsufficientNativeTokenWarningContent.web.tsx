import { Flex, Text, Tooltip } from 'ui/src'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { BridgeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BridgeTokenButton'
import { BuyNativeTokenButton } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/BuyNativeTokenButton'
import { InsufficientNativeTokenBaseComponent } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenBaseComponent'
import type { InsufficientNativeTokenWarningContentProps } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarningContent'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'

export function InsufficientNativeTokenWarningContent({
  address,
  parsedInsufficentNativeTokenWarning,
  nativeCurrencyInfo,
}: InsufficientNativeTokenWarningContentProps): JSX.Element | null {
  const { networkName, modalOrTooltipMainMessage } = parsedInsufficentNativeTokenWarning

  const currencyAddress = currencyIdToAddress(nativeCurrencyInfo.currencyId)

  const bridgingTokenWithHighestBalance = useBridgingTokenWithHighestBalance({
    address,
    currencyAddress,
    currencyChainId: nativeCurrencyInfo.currency.chainId,
  })

  return (
    <Tooltip delay={100} placement="bottom-end">
      <Tooltip.Trigger cursor="default">
        <InsufficientNativeTokenBaseComponent
          parsedInsufficentNativeTokenWarning={parsedInsufficentNativeTokenWarning}
        />
      </Tooltip.Trigger>

      <Tooltip.Content maxWidth={300} px="$spacing16" py="$spacing12">
        <Flex alignItems="center" gap="$spacing18" justifyContent="space-between">
          <Text color="$neutral2" variant="body4">
            {modalOrTooltipMainMessage}
          </Text>

          <Flex centered gap="$spacing8">
            {bridgingTokenWithHighestBalance && (
              <BridgeTokenButton
                inputToken={bridgingTokenWithHighestBalance.currencyInfo}
                outputToken={nativeCurrencyInfo}
                outputNetworkName={networkName}
              />
            )}

            <BuyNativeTokenButton
              nativeCurrencyInfo={nativeCurrencyInfo}
              canBridge={!!bridgingTokenWithHighestBalance}
            />

            <LearnMoreLink textVariant="buttonLabel3" url={uniswapUrls.helpArticleUrls.networkFeeInfo} />
          </Flex>
        </Flex>

        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
