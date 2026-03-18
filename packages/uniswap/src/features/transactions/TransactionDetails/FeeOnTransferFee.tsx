import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { FeeOnTransferWarning } from 'uniswap/src/features/transactions/TransactionDetails/modals/FeeOnTransferWarning'
import {
  FeeOnTransferFeeGroupProps,
  FoTFeeType,
  TokenFeeInfo,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { getFeeSeverity } from 'uniswap/src/features/transactions/TransactionDetails/utils/getFeeSeverity'

export function FeeOnTransferFeeGroup({
  inputTokenInfo,
  outputTokenInfo,
}: FeeOnTransferFeeGroupProps): JSX.Element | null {
  if (!inputTokenInfo.fee.greaterThan(0) && !outputTokenInfo.fee.greaterThan(0)) {
    return null
  }

  // The input token is the one you're selling, therefore it would have a sell fee
  // The output token is the one you're buying, therefore it would have a buy fee
  return (
    <Flex gap="$spacing8">
      {inputTokenInfo.fee.greaterThan(0) && <FeeOnTransferFeeRow feeType="sell" feeInfo={inputTokenInfo} />}
      {outputTokenInfo.fee.greaterThan(0) && <FeeOnTransferFeeRow feeType="buy" feeInfo={outputTokenInfo} />}
    </Flex>
  )
}

function FeeOnTransferFeeRow({ feeType, feeInfo }: { feeType: FoTFeeType; feeInfo: TokenFeeInfo }): JSX.Element {
  const { t } = useTranslation()
  const { severity } = getFeeSeverity(feeInfo.fee)
  const usdAmountLoading = feeInfo.formattedUsdAmount === '-'

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <FeeOnTransferWarning feeInfo={feeInfo} feeType={feeType}>
        <Text color="$neutral2" variant="body3">
          {t('swap.details.feeOnTransfer', { tokenSymbol: feeInfo.tokenSymbol })}
        </Text>
      </FeeOnTransferWarning>
      <Flex row alignItems="center" gap="$spacing4">
        <WarningIcon severity={severity} size="$icon.16" />
        <Text flex={0} variant="body3">
          {usdAmountLoading ? `${feeInfo.formattedAmount} ${feeInfo.tokenSymbol}` : feeInfo.formattedUsdAmount}
        </Text>
      </Flex>
    </Flex>
  )
}
