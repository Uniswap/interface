import { Flex, Text } from '@universe/mycelium'
import { Clear } from '@universe/mycelium/icons/Clear'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { TransactionErrorType } from 'wallet/src/features/dappRequests/types'

const ERROR_MESSAGE_BY_TYPE: Partial<Record<TransactionErrorType, (t: TFunction) => string>> = {
  [TransactionErrorType.DecodeMessage]: (t) => t('dapp.request.signature.decodeError'),
  [TransactionErrorType.DecodeTransaction]: (t) => t('dapp.transaction.error.decodeTransaction'),
  [TransactionErrorType.ContractInteraction]: (t) => t('dapp.transaction.contractInteraction'),
  [TransactionErrorType.UnverifiedRecipient]: (t) => t('dapp.transaction.error.unverifiedRecipient'),
  [TransactionErrorType.ScanUnavailable]: (t) => t('dapp.transaction.error.scanUnavailable'),
}

interface TransactionErrorSectionProps {
  errorType: TransactionErrorType
}

/**
 * Displays error/warning states for transaction and signature requests
 * Shows appropriate message based on error type with red X icon
 */
export function TransactionErrorSection({ errorType }: TransactionErrorSectionProps): JSX.Element | null {
  const { t } = useTranslation()
  const getErrorMessage = ERROR_MESSAGE_BY_TYPE[errorType]
  if (!getErrorMessage) {
    return null
  }

  return (
    <Flex row gap="$spacing8" px="$spacing16" alignItems="center">
      <Clear color="$statusCritical" size="$icon.16" flexShrink={0} />
      <Text color="$neutral2" variant="body3">
        {getErrorMessage(t)}
      </Text>
    </Flex>
  )
}
