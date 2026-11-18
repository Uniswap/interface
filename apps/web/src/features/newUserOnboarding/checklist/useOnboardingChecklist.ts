import { ContentStyle, type InAppNotification } from '@universe/api'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import {
  setNewUserOnboardingChecklistExpanded,
  setNewUserOnboardingWalletFlag,
} from 'uniswap/src/features/behaviorHistory/slice'
import {
  type OnboardingChecklist,
  OnboardingChecklistStepId,
} from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import { useOnboardingChecklistStore } from 'uniswap/src/features/onboarding/checklist/onboardingChecklistStore'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { getOnboardingChecklist } from '~/features/newUserOnboarding/checklist/getOnboardingChecklist'
import { useWebNewUserOnboardingState } from '~/features/newUserOnboarding/useWebNewUserOnboardingState'
import { useCheckHasBackupLogin } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { useNotificationStore } from '~/notification-service/notification-renderer/notificationStore'
import { setOpenModal } from '~/state/application/reducer'

function isSystemBanner(notification: InAppNotification): boolean {
  return notification.content?.style === ContentStyle.SYSTEM_BANNER
}

export interface OnboardingChecklistController extends OnboardingChecklist {
  isExpanded: boolean
  toggleExpanded: () => void
  onStepPress: (stepId: OnboardingChecklistStepId) => void
}

/** Mount once (app chrome); elsewhere read `useOnboardingChecklistStore`. */
export function useOnboardingChecklist({ isMobile }: { isMobile: boolean }): OnboardingChecklistController {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const checkHasBackupLogin = useCheckHasBackupLogin()
  const isLandingPage = useIsPage(PageType.LANDING)
  // System banners (outages, stale data) share the bottom-right corner; the checklist yields until they clear.
  const hasSystemBanner = useNotificationStore((state) => state.activeNotifications.some(isSystemBanner))
  const onboardingState = useWebNewUserOnboardingState()
  const { address, walletHistory, hasBackupLogin } = onboardingState
  const checklist = getOnboardingChecklist({ onboardingState, isHidden: isLandingPage || hasSystemBanner })
  const { isVisible, isComplete, completedCount, steps } = checklist
  // Only the desktop card's open state is persisted: the mobile sheet is transient, and a per-wallet
  // flag set on desktop would reopen it on every mobile load.
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const isExpanded = isMobile ? isSheetOpen : (walletHistory?.checklistExpanded ?? true)

  const eventProperties = { completed_steps: completedCount, total_steps: steps.length }
  const sendChecklistEvent = useEvent(
    (
      eventName:
        | InterfaceEventName.OnboardingChecklistViewed
        | InterfaceEventName.OnboardingChecklistExpanded
        | InterfaceEventName.OnboardingChecklistCollapsed
        | InterfaceEventName.OnboardingChecklistCompleted,
    ) => {
      sendAnalyticsEvent(eventName, eventProperties)
    },
  )

  const setStoreIsVisible = useOnboardingChecklistStore((state) => state.setIsVisible)
  useEffect(() => {
    setStoreIsVisible(isVisible)
    return () => setStoreIsVisible(false)
  }, [isVisible, setStoreIsVisible])

  const shouldMarkSeen = isVisible && !walletHistory?.checklistSeen
  useEffect(() => {
    if (address && shouldMarkSeen) {
      dispatch(setNewUserOnboardingWalletFlag({ address, flag: 'checklistSeen' }))
    }
  }, [address, dispatch, shouldMarkSeen])

  useEffect(() => {
    if (address && isVisible) {
      sendChecklistEvent(InterfaceEventName.OnboardingChecklistViewed)
    }
  }, [address, isVisible, sendChecklistEvent])

  const shouldMarkCompleted = isComplete && !!walletHistory?.checklistSeen && !walletHistory.checklistCompleted
  useEffect(() => {
    if (address && shouldMarkCompleted) {
      dispatch(setNewUserOnboardingWalletFlag({ address, flag: 'checklistCompleted' }))
      sendChecklistEvent(InterfaceEventName.OnboardingChecklistCompleted)
    }
  }, [address, dispatch, sendChecklistEvent, shouldMarkCompleted])

  const setExpanded = useEvent((nextIsExpanded: boolean) => {
    if (isMobile) {
      setIsSheetOpen(nextIsExpanded)
    } else if (address) {
      dispatch(setNewUserOnboardingChecklistExpanded({ address, isExpanded: nextIsExpanded }))
    }
  })

  const toggleExpanded = useEvent(() => {
    sendChecklistEvent(
      isExpanded ? InterfaceEventName.OnboardingChecklistCollapsed : InterfaceEventName.OnboardingChecklistExpanded,
    )
    setExpanded(!isExpanded)
  })

  const openBackupLoginStep = useEvent(async () => {
    if (hasBackupLogin === undefined) {
      try {
        if (await checkHasBackupLogin()) {
          return
        }
      } catch (error) {
        logger.warn('useOnboardingChecklist', 'openBackupLoginStep', 'Backup login check failed', { error })
        return
      }
    }
    dispatch(setOpenModal({ name: ModalName.AddBackupLogin }))
  })

  const onStepPress = useEvent((stepId: OnboardingChecklistStepId) => {
    sendAnalyticsEvent(InterfaceEventName.OnboardingChecklistStepClicked, { ...eventProperties, step: stepId })
    // Collapse so the card doesn't cover what the step opens
    setExpanded(false)

    switch (stepId) {
      case OnboardingChecklistStepId.FundWallet:
        dispatch(setOpenModal({ name: ModalName.AddFunds, initialState: {} }))
        break
      case OnboardingChecklistStepId.CompleteSwap:
        navigate('/swap')
        break
      case OnboardingChecklistStepId.AddBackupLogin:
        void openBackupLoginStep()
        break
      // Mobile-only steps
      case OnboardingChecklistStepId.BackupWallet:
      case OnboardingChecklistStepId.ClaimUsername:
      case OnboardingChecklistStepId.CreateAccount:
        break
    }
  })

  return { ...checklist, isExpanded, toggleExpanded, onStepPress }
}
