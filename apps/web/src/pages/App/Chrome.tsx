import Polling from 'components/Polling'
import Popups from 'components/Popups'
import TopLevelModals from 'components/TopLevelModals'

export default function AppChrome() {
  return (
    <>
      <Popups />
      <Polling />
      <TopLevelModals />
    </>
  )
}
