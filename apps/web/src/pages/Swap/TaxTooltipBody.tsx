import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'

export function OutputTaxTooltipBody({ currencySymbol }: { currencySymbol?: string }) {
  return (
    <>
      <Text variant="body3">
        <Trans i18nKey="swap.taxTooltip.label" />
      </Text>
      <Flex width="100%" height={1} backgroundColor="surface3" my="$spacing4" borderWidth={0} />
      <Text variant="body4">
        {currencySymbol ? (
          <Trans i18nKey="swap.taxTooltip.tokenSelected" values={{ tokenSymbol: currencySymbol }} />
        ) : (
          <Trans i18nKey="swap.taxTooltip.noTokenSelected" />
        )}
      </Text>
    </>
  )
}
