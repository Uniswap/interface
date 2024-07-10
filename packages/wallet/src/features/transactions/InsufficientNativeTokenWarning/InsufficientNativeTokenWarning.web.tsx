import { Flex, Text, Tooltip } from 'ui/src'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
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

  if (!parsedInsufficentNativeTokenWarning) {
    return null
  }

  const { modalOrTooltipMainMessage } = parsedInsufficentNativeTokenWarning

  return (
    <Tooltip delay={100} placement="bottom-end">
      <Tooltip.Trigger cursor="default">
        <InsufficientNativeTokenBaseComponent
          parsedInsufficentNativeTokenWarning={parsedInsufficentNativeTokenWarning}
        />
      </Tooltip.Trigger>

      <Tooltip.Content maxWidth={250} px="$spacing16" py="$spacing12">
        <Flex gap="$spacing8">
          <Text color="$neutral2" variant="body4">
            {modalOrTooltipMainMessage}
          </Text>

          <LearnMoreLink textVariant="body4" url={uniswapUrls.helpArticleUrls.networkFeeInfo} />
        </Flex>

        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
