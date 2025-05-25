import { memo, type ComponentType } from 'react'
import type { AppStackParamList, AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import type { GetProps } from 'ui/src'
import { PasskeyManagementModal } from 'uniswap/src/features/passkey/PasskeyManagementModal'
import { PasskeysHelpModal } from 'uniswap/src/features/passkey/PasskeysHelpModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { SettingsLanguageModal } from 'wallet/src/components/settings/language/SettingsLanguageModal'
import { PermissionsModal } from 'wallet/src/components/settings/permissions/PermissionsModal'
import { PortfolioBalanceModal } from 'wallet/src/components/settings/portfolioBalance/PortfolioBalanceModal'
import { PostSwapSmartWalletNudge } from 'wallet/src/components/smartWallet/modals/PostSwapSmartWalletNudge'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import { SmartWalletAdvancedSettingsModal } from 'wallet/src/features/smartWallet/modals/SmartWalletAdvancedSettingsModal'
import { SmartWalletConfirmModal } from 'wallet/src/features/smartWallet/modals/SmartWalletConfirmModal'
import { SmartWalletInsufficientFundsOnNetworkModal } from 'wallet/src/features/smartWallet/modals/SmartWalletInsufficientFundsOnNetworkModal'

// Define names of shared modals we're explicitly supporting on mobile
type ValidModalNames = keyof Pick<
  AppStackParamList,
  | typeof ModalName.TestnetMode
  | typeof ModalName.HiddenTokenInfoModal
  | typeof ModalName.PasskeyManagement
  | typeof ModalName.PasskeysHelp
  | typeof ModalName.SmartWalletAdvancedSettingsModal
  | typeof ModalName.SmartWalletConfirmModal
  | typeof ModalName.SmartWalletEnabledModal
  | typeof ModalName.SmartWalletInsufficientFundsOnNetworkModal
  | typeof ModalName.PostSwapSmartWalletNudge
  | typeof ModalName.PermissionsModal
  | typeof ModalName.PortfolioBalanceModal
  | typeof ModalName.LanguageSelector
>

type ModalNameWithComponentProps = {
  [ModalName.TestnetMode]: GetProps<typeof TestnetModeModal>
  [ModalName.HiddenTokenInfoModal]: GetProps<typeof HiddenTokenInfoModal>
  [ModalName.PasskeyManagement]: GetProps<typeof PasskeyManagementModal>
  [ModalName.PasskeysHelp]: GetProps<typeof PasskeysHelpModal>
  [ModalName.PostSwapSmartWalletNudge]: GetProps<typeof PostSwapSmartWalletNudge>
  [ModalName.SmartWalletAdvancedSettingsModal]: GetProps<typeof SmartWalletAdvancedSettingsModal>
  [ModalName.SmartWalletConfirmModal]: GetProps<typeof SmartWalletConfirmModal>
  [ModalName.SmartWalletEnabledModal]: GetProps<typeof SmartWalletEnabledModal>
  [ModalName.SmartWalletInsufficientFundsOnNetworkModal]: GetProps<typeof SmartWalletInsufficientFundsOnNetworkModal>
  [ModalName.PermissionsModal]: GetProps<typeof PermissionsModal>
  [ModalName.PortfolioBalanceModal]: GetProps<typeof PortfolioBalanceModal>
  [ModalName.LanguageSelector]: GetProps<typeof SettingsLanguageModal>
}

type NavigationModalProps<ModalName extends ValidModalNames> = {
  modalComponent: ComponentType<ModalNameWithComponentProps[ModalName]>
  route: AppStackScreenProp<ModalName>['route']
}

/**
 * A generic wrapper component that adapts a shared modal to work with React Navigation.
 */
function _ReactNavigationModal<ModalName extends ValidModalNames>({
  modalComponent: ModalComponent,
  route,
}: NavigationModalProps<ModalName>): JSX.Element {
  const { onClose } = useReactNavigationModal()
  const params = (route.params ?? {}) as NonNullable<typeof route.params>

  return <ModalComponent {...params} isOpen onClose={onClose} />
}

export const ReactNavigationModal = memo(_ReactNavigationModal)
