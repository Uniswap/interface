import { PopupRenderer } from '~/app/layout/Popups/PopupRenderer'
import { TopLevelModals } from '~/app/layout/TopLevelModals'
import { OnboardingChecklist } from '~/features/newUserOnboarding/checklist/OnboardingChecklist'
import { ClaimPopup } from '~/features/wallet/claim/ClaimPopup'
import { RedirectAfterConnect } from '~/features/wallet/components/RedirectAfterConnect'

export default function AppChrome() {
  return (
    <>
      <PopupRenderer />
      <ClaimPopup />
      <RedirectAfterConnect />
      <OnboardingChecklist />
      <TopLevelModals />
    </>
  )
}
