import { ChainConnectivityWarning } from 'components/ChainConnectivityWarning'
import ClaimPopup from 'components/Popups/ClaimPopup'
import { PopupRenderer } from 'components/Popups/PopupRenderer'
import TopLevelModals from 'components/TopLevelModals'

export default function AppChrome() {
  return (
    <>
      <PopupRenderer />
      <ClaimPopup />
      <ChainConnectivityWarning />
      <TopLevelModals />
    </>
  )
}
