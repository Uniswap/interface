import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { SwapFeeInfo } from 'wallet/src/features/routing/types'

export type OnShowSwapFeeInfo = (noFee: boolean) => void

export function SwapFee({
  swapFeeInfo,
  onShowSwapFeeInfo,
}: {
  swapFeeInfo: SwapFeeInfo
  onShowSwapFeeInfo: OnShowSwapFeeInfo
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <TouchableArea onPress={(): void => onShowSwapFeeInfo(swapFeeInfo.noFeeCharged)}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('Fee')}
            {!swapFeeInfo.noFeeCharged && ` (${swapFeeInfo.formattedPercent})`}
          </Text>
          <Icons.InfoCircleFilled color="$neutral3" size="$icon.16" />
        </Flex>
      </TouchableArea>
      <Flex row alignItems="center" gap="$spacing8">
        <Flex row alignItems="center" justifyContent="space-between">
          <Text color="$neutral1" variant="body3">
            {swapFeeInfo.formattedAmountFiat ??
              (swapFeeInfo.noFeeCharged ? '$0' : swapFeeInfo.formattedAmount)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
