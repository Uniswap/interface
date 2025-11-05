import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ReportTokenIssueModal } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const ReportTokenIssueModalScreen = (
  props: AppStackScreenProp<typeof ModalName.ReportTokenIssue>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={ReportTokenIssueModal} />
}
