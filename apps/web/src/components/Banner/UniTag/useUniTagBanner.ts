import { useIsLandingPage } from 'hooks/useIsLandingPage'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback } from 'react'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

const shouldHideUniTagBannerAtom = atomWithStorage<boolean>('shouldHideUniTagBanner', false)

export function useUniTagBanner() {
  const isLandingPage = useIsLandingPage()
  const [shouldHideUniTagBanner, updateShouldHideUniTagBanner] = useAtom(shouldHideUniTagBannerAtom)
  const openGetTheAppModal = useOpenModal(ApplicationModal.GET_THE_APP)
  const handleAccept = useCallback(() => {
    openGetTheAppModal()
    updateShouldHideUniTagBanner(true)
  }, [openGetTheAppModal, updateShouldHideUniTagBanner])
  const handleReject = useCallback(() => {
    updateShouldHideUniTagBanner(true)
  }, [updateShouldHideUniTagBanner])

  return {
    shouldHideUniTagBanner: Boolean(isLandingPage || shouldHideUniTagBanner),
    handleAccept,
    handleReject,
  }
}
