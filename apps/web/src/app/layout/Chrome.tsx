import { TopLevelModals } from '~/app/layout/TopLevelModals'
import { PopupRenderer } from '~/components/Popups/PopupRenderer'
import { ClaimPopup } from '~/features/claim/ClaimPopup'

export default function AppChrome() {
  return (
    <>
      <PopupRenderer />
      <ClaimPopup />
      <TopLevelModals />
    </>
  )
}
