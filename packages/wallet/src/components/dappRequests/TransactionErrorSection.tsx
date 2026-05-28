import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Clear } from 'ui/src/components/icons'

export type TransactionErrorType = 'decode_message' | 'decode_transaction' | 'contract_interaction'

interface TransactionErrorSectionProps {
  errorType: TransactionErrorType
}

/**
 * Displays error/warning states for transaction and signature requests
 * Shows appropriate message based on error type with red X icon
 */
export function TransactionErrorSection({ errorType }: TransactionErrorSectionProps): JSX.Element {
  const { t } = useTranslation()

  const errorMessage =
    errorType === 'decode_message'
      ? t('dapp.request.signature.decodeError')
      : errorType === 'decode_transaction'
        ? t('dapp.transaction.error.decodeTransaction')
        : t('dapp.transaction.contractInteraction')

  return (
    <Flex row gap="$spacing8" px="$spacing16" alignItems="center">
      <Clear color="$statusCritical" size="$icon.16" flexShrink={0} />
      <Text color="$neutral2" variant="body3">
        {errorMessage}
      </Text>
    </Flex>
  )
}
