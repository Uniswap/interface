import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagEntryPoint } from 'src/app/navigation/types'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName, UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens, OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { selectHasCompletedUnitagsIntroModal } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/slice'

export function useUnitagClaimHandler({
  address,
  entryPoint,
  analyticsEntryPoint,
}: {
  address: string
  entryPoint: Exclude<UnitagEntryPoint, OnboardingScreens.Landing>
  analyticsEntryPoint: 'home' | 'settings'
}): {
  handleClaim: () => void
  handleDismiss: () => void
} {
  const dispatch = useDispatch()
  const hasCompletedUnitagsIntroModal = useSelector(selectHasCompletedUnitagsIntroModal)

  const handleClaim = useCallback(() => {
    sendAnalyticsEvent(UnitagEventName.UnitagBannerActionTaken, {
      action: 'claim',
      entryPoint: analyticsEntryPoint,
    })

    if (hasCompletedUnitagsIntroModal) {
      navigate(MobileScreens.UnitagStack, {
        screen: UnitagScreens.ClaimUnitag,
        params: {
          entryPoint,
          address,
        },
      })
    } else {
      dispatch(
        openModal({
          name: ModalName.UnitagsIntro,
          initialState: { address, entryPoint },
        }),
      )
    }
  }, [address, analyticsEntryPoint, dispatch, entryPoint, hasCompletedUnitagsIntroModal])

  const handleDismiss = useCallback(() => {
    sendAnalyticsEvent(UnitagEventName.UnitagBannerActionTaken, {
      action: 'dismiss',
      entryPoint: analyticsEntryPoint,
    })
    dispatch(setHasSkippedUnitagPrompt(true))
  }, [analyticsEntryPoint, dispatch])

  return {
    handleClaim,
    handleDismiss,
  }
}
