import { TradingApi } from '@universe/api'
import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { useTranslation } from 'react-i18next'
import { SlippageEdit } from 'uniswap/src/features/transactions/TransactionDetails/SlippageEdit'

export function ExpectedFailureBanner({
  isSwap,
  txFailureReasons,
  onSlippageEditPress,
  ...props
}: {
  isSwap: boolean
  txFailureReasons?: TradingApi.TransactionFailureReason[]
  onSlippageEditPress?: () => void
} & FlexCompatProps): JSX.Element {
  const { t } = useTranslation()

  const showSlippageWarning = isSwap && txFailureReasons?.includes(TradingApi.TransactionFailureReason.SLIPPAGE_TOO_LOW)

  // Non-swap (e.g. send) uses gas/transaction copy — never "This swap may fail".
  const title = isSwap ? t('swap.warning.expectedFailure.titleMay') : t('dapp.request.error.gasEstimation')

  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="flex-start"
      borderRadius="$rounded16"
      borderColor="$surface3"
      borderWidth="$spacing1"
      gap="$spacing12"
      p="$spacing12"
      {...props}
    >
      <Flex row shrink gap="$spacing12" alignItems="center" flex={1}>
        <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
        <Flex shrink gap="$spacing4" flex={1}>
          <Text color="$statusWarning" variant="buttonLabel3">
            {title}
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
