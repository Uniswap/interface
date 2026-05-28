import { AppStackScreenProp } from 'src/app/navigation/types'
import { ReactNavigationModal } from 'src/components/modals/ReactNavigationModals/ReactNavigationModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { PermissionsModal } from 'wallet/src/components/settings/permissions/PermissionsModal'

export const PermissionsSettingsScreen = (
  props: AppStackScreenProp<typeof ModalName.PermissionsModal>,
): JSX.Element => {
  return <ReactNavigationModal {...props} modalComponent={PermissionsModal} />
}
