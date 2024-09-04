import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SwapFeeInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { NumberType } from 'utilities/src/format/types'
import { SwapFeeWarning } from 'wallet/src/features/transactions/swap/modals/SwapFeeWarning'

export function SwapFee({ swapFeeInfo }: { swapFeeInfo: SwapFeeInfo }): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <SwapFeeWarning noFee={swapFeeInfo.noFeeCharged}>
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('swap.details.uniswapFee')}
            {!swapFeeInfo.noFeeCharged && ` (${swapFeeInfo.formattedPercent})`}
          </Text>
        </Flex>
      </SwapFeeWarning>
      <Flex row alignItems="center" gap="$spacing8">
        <Flex row alignItems="center" justifyContent="space-between">
          <Text color="$neutral1" variant="body3">
            {swapFeeInfo.formattedAmountFiat ??
              (swapFeeInfo.noFeeCharged
                ? formatNumberOrString({ value: 0, type: NumberType.FiatGasPrice })
                : swapFeeInfo.formattedAmount)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
