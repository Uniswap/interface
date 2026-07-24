import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { resetActivePlan } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import { signalEarnModalClosed } from 'uniswap/src/utils/saga'

export interface EarnReviewModalHandlers {
  hasExecutionError: boolean
  setHasExecutionError: (hasError: boolean) => void
  handleExecutionFailure: (error?: Error) => void
  handleClose: () => void
}

export function useEarnReviewModalHandlers({ onClose }: { onClose: () => void }): EarnReviewModalHandlers {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [hasExecutionError, setHasExecutionError] = useState(false)

  const handleExecutionFailure = useCallback(
    (error?: Error) => {
      if (error) {
        setHasExecutionError(true)
      }
      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: error?.message ?? t('common.error.general'),
        }),
      )
    },
    [dispatch, t],
  )

  const handleClose = useCallback(() => {
    dispatch(signalEarnModalClosed())
    if (hasExecutionError) {
      resetActivePlan()
    }
    onClose()
  }, [dispatch, hasExecutionError, onClose])

  return { hasExecutionError, setHasExecutionError, handleExecutionFailure, handleClose }
}
