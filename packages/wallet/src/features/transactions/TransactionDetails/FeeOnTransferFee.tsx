import { Percent } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { FeeOnTransferWarning } from 'wallet/src/features/transactions/swap/modals/FeeOnTransferWarning'

export type FeeOnTransferFeeGroupProps = {
  inputTokenInfo: TokenFeeInfo
  outputTokenInfo: TokenFeeInfo
}

export type TokenFeeInfo = {
  tokenSymbol: string
  fee: Percent
}

export function FeeOnTransferFeeGroup({
  inputTokenInfo,
  outputTokenInfo,
}: FeeOnTransferFeeGroupProps): JSX.Element | null {
  if (!inputTokenInfo.fee.greaterThan(0) && !outputTokenInfo.fee.greaterThan(0)) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      {inputTokenInfo.fee.greaterThan(0) && <FeeOnTransferFeeRow feeInfo={inputTokenInfo} />}
      {outputTokenInfo.fee.greaterThan(0) && <FeeOnTransferFeeRow feeInfo={outputTokenInfo} />}
    </Flex>
  )
}

function FeeOnTransferFeeRow({ feeInfo }: { feeInfo: TokenFeeInfo }): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <FeeOnTransferWarning>
        <Text color="$neutral2" variant="body3">
          {t('swap.details.feeOnTransfer', { tokenSymbol: feeInfo.tokenSymbol })}
        </Text>
      </FeeOnTransferWarning>
      <Flex row alignItems="center" gap="$spacing8">
        <Text flex={0} variant="body3">
          {formatPercent(feeInfo.fee.toFixed(6))}
        </Text>
      </Flex>
    </Flex>
  )
}
