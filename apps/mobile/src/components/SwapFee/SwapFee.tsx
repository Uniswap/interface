import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { formatPercent } from 'utilities/src/format/format'
import { SwapFeeCurrencyInfo } from 'wallet/src/features/routing/types'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'wallet/src/utils/currency'

export function SwapFee({
  swapFee,
  onShowSwapFeeInfo,
}: {
  swapFee: SwapFeeCurrencyInfo
  onShowSwapFeeInfo?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const percent = swapFee?.percent.greaterThan(0)
    ? formatPercent(swapFee.percent.toFixed())
    : undefined
  // we want to explicelty show $0 for the fee if it is 0
  const formattedFee = swapFee?.percent.equalTo(0)
    ? '$0'
    : getFormattedCurrencyAmount(swapFee.currency, swapFee.amount) +
      getSymbolDisplayText(swapFee.currency.symbol)

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <TouchableArea onPress={onShowSwapFeeInfo}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('Fee')}
            {percent && ` (${percent})`}
          </Text>
          <Icons.InfoCircleFilled color="$neutral3" size="$icon.16" />
        </Flex>
      </TouchableArea>
      <Flex row alignItems="center" gap="$spacing8">
        <Flex row alignItems="center" justifyContent="space-between">
          <Text color="$neutral1" variant="body3">
            {formattedFee}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
