import ClaimPopup from '~/components/Popups/ClaimPopup'
import { PopupRenderer } from '~/components/Popups/PopupRenderer'
import TopLevelModals from '~/pages/App/TopLevelModals'

export default function AppChrome() {
  return (
    <>
      <PopupRenderer />
      <ClaimPopup />
      <TopLevelModals />
    </>
  )
}
