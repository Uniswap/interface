import { PopupRenderer } from '~/components/Popups/PopupRenderer'
import { ClaimPopup } from '~/features/claim/ClaimPopup'
import { TopLevelModals } from '~/pages/App/TopLevelModals'

export default function AppChrome() {
  return (
    <>
      <PopupRenderer />
      <ClaimPopup />
      <TopLevelModals />
    </>
  )
}
