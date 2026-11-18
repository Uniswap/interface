import { getValidAddress, Platform } from '@universe/chains'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { MobileState } from 'src/app/mobileReducer'
import { navigate } from 'src/app/navigation/rootNavigation'
import {
  getOnboardingChecklist,
  type MobileOnboardingChecklist,
} from 'src/components/home/onboardingChecklist/getOnboardingChecklist'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectNewUserOnboardingWalletHistory } from 'uniswap/src/features/behaviorHistory/selectors'
import { setNewUserOnboardingWalletFlag } from 'uniswap/src/features/behaviorHistory/slice'
import { OnboardingChecklistStepId } from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import { useOnboardingChecklistStore } from 'uniswap/src/features/onboarding/checklist/onboardingChecklistStore'
import { useNewUserOnboardingState } from 'uniswap/src/features/onboarding/useNewUserOnboardingState'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag'
import { useUnitagClaimHandler } from 'wallet/src/features/unitags/useUnitagClaimHandler'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'
import { useActiveAccountWithThrow, useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export interface OnboardingChecklistController extends MobileOnboardingChecklist {
  isSheetOpen: boolean
  openSheet: () => void
  closeSheet: () => void
  onStepPress: (stepId: OnboardingChecklistStepId) => void
  dismiss: () => void
}

/** Call once, on the home screen; elsewhere read `useOnboardingChecklistStore`. */
export function useOnboardingChecklist(): OnboardingChecklistController {
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const { address, walletHistory, ...onboardingState } = useNewUserOnboardingState()
  const { canClaimUnitag, isLoading: isEligibilityLoading } = useCanActiveAddressClaimUnitag()
  // Same params as the display name lookup, so the cache entry is shared
  const validatedAddress = getValidAddress({ address: activeAccount.address, platform: Platform.EVM })
  const { data: unitag, isLoading: isUnitagLoading } = useUnitagsAddressQuery({
    params: validatedAddress ? { address: validatedAddress } : undefined,
  })
  // Other wallets are only known locally: swaps made on this device, or found while that wallet was active
  const signerAccounts = useSignerAccounts()
  const hasSwappedOnAnyWallet = useSelector((state: MobileState) =>
    signerAccounts.some((account) => selectNewUserOnboardingWalletHistory(state, account.address)?.hasCompletedSwap),
  )

  const checklist = getOnboardingChecklist({
    onboardingState,
    walletHistory,
    isSignerAccount: activeAccount.type === AccountType.SignerMnemonic,
    hasSwappedOnAnyWallet,
    hasBackup: hasExternalBackup(activeAccount),
    hasUsername: !!unitag?.username,
    canClaimUsername: canClaimUnitag,
    isUsernameLoading: isEligibilityLoading || isUnitagLoading,
  })
  const { isVisible, isComplete, isLoading, completedCount, steps } = checklist

  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
  const setStoreIsLoading = useOnboardingChecklistStore((state) => state.setIsLoading)
  useEffect(() => {
    setStoreIsLoading(isLoading)
    return () => setStoreIsLoading(false)
  }, [isLoading, setStoreIsLoading])

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

  // While loading, the username step may not be listed yet, so a wallet with every required step done
  // would look complete and lose the step for good
  const shouldMarkCompleted =
    isComplete && !isLoading && !!walletHistory?.checklistSeen && !walletHistory.checklistCompleted
  useEffect(() => {
    if (address && shouldMarkCompleted) {
      dispatch(setNewUserOnboardingWalletFlag({ address, flag: 'checklistCompleted' }))
      sendChecklistEvent(InterfaceEventName.OnboardingChecklistCompleted)
    }
  }, [address, dispatch, sendChecklistEvent, shouldMarkCompleted])

  const openSheet = useEvent(() => {
    sendChecklistEvent(InterfaceEventName.OnboardingChecklistExpanded)
    setIsSheetOpen(true)
  })

  const closeSheet = useEvent(() => {
    sendChecklistEvent(InterfaceEventName.OnboardingChecklistCollapsed)
    setIsSheetOpen(false)
  })

  const navigateToUnitagClaim = useEvent(() => {
    navigate(MobileScreens.UnitagStack, {
      screen: UnitagScreens.ClaimUnitag,
      params: { entryPoint: MobileScreens.Home, address: activeAccount.address },
    })
  })

  const navigateToUnitagIntro = useEvent(() => {
    navigate(ModalName.UnitagsIntro, { address: activeAccount.address, entryPoint: MobileScreens.Home })
  })

  const { handleClaim: claimUsername, handleDismiss: dismissUsernamePrompt } = useUnitagClaimHandler({
    analyticsEntryPoint: 'home',
    navigateToClaim: navigateToUnitagClaim,
    navigateToIntro: navigateToUnitagIntro,
  })

  const onStepPress = useEvent((stepId: OnboardingChecklistStepId) => {
    sendAnalyticsEvent(InterfaceEventName.OnboardingChecklistStepClicked, { ...eventProperties, step: stepId })
    setIsSheetOpen(false)

    switch (stepId) {
      case OnboardingChecklistStepId.FundWallet:
        navigate(ModalName.FundWallet)
        break
      case OnboardingChecklistStepId.BackupWallet:
        navigate(MobileScreens.OnboardingStack, {
          screen: OnboardingScreens.Backup,
          params: { importType: ImportType.BackupOnly, entryPoint: OnboardingEntryPoint.BackupCard },
        })
        break
      case OnboardingChecklistStepId.CompleteSwap:
        navigate(ModalName.Swap)
        break
      case OnboardingChecklistStepId.ClaimUsername:
        claimUsername()
        break
      // Web-only step
      case OnboardingChecklistStepId.AddBackupLogin:
      case OnboardingChecklistStepId.CreateAccount:
        break
    }
  })

  const dismiss = useEvent(() => {
    setIsSheetOpen(false)
    dismissUsernamePrompt()
    if (address) {
      dispatch(setNewUserOnboardingWalletFlag({ address, flag: 'checklistCompleted' }))
    }
  })

  return { ...checklist, isSheetOpen, openSheet, closeSheet, onStepPress, dismiss }
}
