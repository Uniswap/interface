import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { resetStoppedEarnPlan } from 'uniswap/src/features/earn/hooks/useEarnReviewExecutionHandlers'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { signalEarnModalClosed } from 'uniswap/src/utils/saga'

export interface EarnReviewModalHandlers {
  handleExecutionFailure: (error?: Error) => void
  handleClose: () => void
}

export function useEarnReviewModalHandlers({ onClose }: { onClose: () => void }): EarnReviewModalHandlers {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const handleExecutionFailure = useCallback(
    (error?: Error) => {
      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: error?.message ?? t('common.error.general'),
        }),
      )
    },
    [dispatch, t],
  )

  // Every dismissal path funnels here (sheet swipe, backdrop, hardware back, close button),
  // so this is where a stopped partial plan must be cleared — not only the review view's buttons.
  const handleClose = useCallback(() => {
    dispatch(signalEarnModalClosed())
    resetStoppedEarnPlan()
    onClose()
  }, [dispatch, onClose])

  return { handleExecutionFailure, handleClose }
}
