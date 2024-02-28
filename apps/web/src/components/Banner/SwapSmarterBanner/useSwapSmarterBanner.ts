import { useSwapSmarterEnabled } from 'featureFlags/flags/swapSmarter'
import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback } from 'react'

const shouldHideSwapSmarterBannerAtom = atomWithStorage<boolean>('shouldHideSwapSmarterBanner', false)

export function useSwapSmarterBanner() {
  const isLandingPage = useIsLandingPage()
  const isEnabled = useSwapSmarterEnabled()
  const [shouldHideSwapSmarterBanner, updateShouldHideSwapSmarterBanner] = useAtom(shouldHideSwapSmarterBannerAtom)
  const handleAccept = useCallback(() => {
    updateShouldHideSwapSmarterBanner(true)
    window.open(
      'http://smarter.uniswap.org/?utm_medium=banner&utm_source=uniswap&utm_campaign=swap-smarter&utm_creative=',
      '_blank'
    )
  }, [updateShouldHideSwapSmarterBanner])
  const handleReject = useCallback(() => {
    updateShouldHideSwapSmarterBanner(true)
  }, [updateShouldHideSwapSmarterBanner])

  return {
    shouldShowBanner: isEnabled && isLandingPage && !shouldHideSwapSmarterBanner,
    handleAccept,
    handleReject,
  }
}
