import { ChainConnectivityWarning } from 'components/ChainConnectivityWarning'
import Popups from 'components/Popups'
import TopLevelModals from 'components/TopLevelModals'

export default function AppChrome() {
  return (
    <>
      <Popups />
      <ChainConnectivityWarning />
      <TopLevelModals />
    </>
  )
}
