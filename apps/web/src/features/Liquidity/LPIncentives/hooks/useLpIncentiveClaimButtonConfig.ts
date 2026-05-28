import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface UseLpIncentiveClaimButtonConfigProps {
  isLoading: boolean
  isPendingTransaction: boolean
  onClaim: () => void
}

export function useLpIncentiveClaimButtonConfig({
  isLoading,
  isPendingTransaction,
  onClaim,
}: UseLpIncentiveClaimButtonConfigProps) {
  const { t } = useTranslation()

  return useMemo(() => {
    if (isLoading) {
      return {
        title: t('common.confirmWallet'),
        onClick: () => {},
        isLoading: true,
      }
    }

    if (isPendingTransaction) {
      return {
        title: t('common.transactionPending'),
        onClick: () => {},
        isLoading: true,
      }
    }

    return {
      title: t('pool.incentives.collect'),
      onClick: onClaim,
      isLoading,
    }
  }, [onClaim, isLoading, isPendingTransaction, t])
}
