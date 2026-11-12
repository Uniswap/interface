import { TopLevelModals } from '~/app/layout/TopLevelModals'
import { PopupRenderer } from '~/components/Popups/PopupRenderer'
import { ClaimPopup } from '~/features/wallet/claim/ClaimPopup'
import { RedirectAfterConnect } from '~/features/wallet/components/RedirectAfterConnect'

export default function AppChrome() {
  return (
    <>
      <PopupRenderer />
      <ClaimPopup />
      <RedirectAfterConnect />
      <TopLevelModals />
    </>
  )
}
