import { Flex, Text, Tooltip } from 'ui/src'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { BuyNativeTokenButton } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/BuyNativeTokenButton'
import { InsufficientNativeTokenBaseComponent } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenBaseComponent'
import type { InsufficientNativeTokenWarningProps } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useInsufficientNativeTokenWarning } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'

export function InsufficientNativeTokenWarning({
  warnings,
  flow,
  gasFee,
}: InsufficientNativeTokenWarningProps): JSX.Element | null {
  const parsedInsufficentNativeTokenWarning = useInsufficientNativeTokenWarning({
    warnings,
    flow,
    gasFee,
  })

  const { modalOrTooltipMainMessage, nativeCurrencyInfo } = parsedInsufficentNativeTokenWarning ?? {}

  if (!parsedInsufficentNativeTokenWarning || !nativeCurrencyInfo) {
    return null
  }

  return (
    <Tooltip delay={100} placement="bottom-end">
      <Tooltip.Trigger cursor="default">
        <InsufficientNativeTokenBaseComponent
          parsedInsufficentNativeTokenWarning={parsedInsufficentNativeTokenWarning}
        />
      </Tooltip.Trigger>

      <Tooltip.Content maxWidth={300} px="$spacing16" py="$spacing12">
        <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
          <Text color="$neutral2" variant="body4">
            {modalOrTooltipMainMessage}
          </Text>

          <Flex centered gap="$spacing8">
            <BuyNativeTokenButton nativeCurrencyInfo={nativeCurrencyInfo} />
            <LearnMoreLink textVariant="buttonLabel3" url={uniswapUrls.helpArticleUrls.networkFeeInfo} />
          </Flex>
        </Flex>

        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
