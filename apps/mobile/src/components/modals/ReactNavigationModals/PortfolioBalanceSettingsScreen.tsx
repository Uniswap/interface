import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { PortfolioBalanceModal } from 'wallet/src/components/settings/portfolioBalance/PortfolioBalanceModal'

export const PortfolioBalanceSettingsScreen = (
  props: AppStackScreenProp<typeof ModalName.PortfolioBalanceModal>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={PortfolioBalanceModal} />
}
