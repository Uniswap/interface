import { TradingApi } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { SlippageEdit } from 'uniswap/src/features/transactions/TransactionDetails/SlippageEdit'

export function ExpectedFailureBanner({
  txFailureReasons,
  onSlippageEditPress,
}: {
  txFailureReasons?: TradingApi.TransactionFailureReason[]
  onSlippageEditPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const showSlippageWarning = txFailureReasons?.includes(TradingApi.TransactionFailureReason.SLIPPAGE_TOO_LOW)

  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      borderRadius="$rounded16"
      borderColor="$surface3"
      borderWidth="$spacing1"
      gap="$spacing12"
      p="$spacing12"
    >
      <Flex row justifyContent="flex-start" gap="$spacing12" alignItems="center">
        <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
        <Flex gap="$spacing4">
          <Text color="$statusWarning" variant="buttonLabel3">
            {t('swap.warning.expectedFailure.titleMay')}
          </Text>
          {showSlippageWarning && (
            <Text color="$neutral2" variant="body4">
              {t('swap.warning.expectedFailure.increaseSlippage')}
            </Text>
          )}
        </Flex>
      </Flex>
      {showSlippageWarning && <SlippageEdit onWalletSlippageEditPress={onSlippageEditPress} />}
    </Flex>
  )
}
