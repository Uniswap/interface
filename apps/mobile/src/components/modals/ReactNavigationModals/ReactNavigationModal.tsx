import { type ComponentType, memo } from 'react'
import type { AppStackParamList, AppStackScreenProp } from 'src/app/navigation/types'
import { EarnDepositReviewModal } from 'src/components/earn/EarnDepositReviewModal'
import { EarnVaultModal } from 'src/components/earn/EarnVaultModal'
import { EarnYouNeedTokenModal } from 'src/components/earn/EarnYouNeedTokenModal'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import type { GetProps } from 'ui/src'
import { BridgedAssetModal } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { WormholeModal } from 'uniswap/src/components/BridgedAsset/WormholeModal'
import { ReportPortfolioDataModal } from 'uniswap/src/components/reporting/ReportPortfolioDataModal'
import { ReportTokenDataModal } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModal } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { PasskeyManagementModal } from 'uniswap/src/features/passkey/PasskeyManagementModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { HiddenTokenInfoModal } from 'uniswap/src/features/transactions/modals/HiddenTokenInfoModal'
import { AboutModal } from 'wallet/src/components/settings/about/AboutModal'
import { PermissionsModal } from 'wallet/src/components/settings/permissions/PermissionsModal'
import { PortfolioBalanceModal } from 'wallet/src/components/settings/portfolioBalance/PortfolioBalanceModal'
import { SmartWalletAdvancedSettingsModal } from 'wallet/src/components/smartWallet/modals/SmartWalletAdvancedSettingsModal'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import { SmartWalletNudge } from 'wallet/src/components/smartWallet/modals/SmartWalletNudge'

// Define names of shared modals we're explicitly supporting on mobile
type ValidModalNames = keyof Pick<
  AppStackParamList,
  | typeof ModalName.TestnetMode
  | typeof ModalName.HiddenTokenInfoModal
  | typeof ModalName.PasskeyManagement
  | typeof ModalName.SmartWalletAdvancedSettingsModal
  | typeof ModalName.SmartWalletEnabledModal
  | typeof ModalName.SmartWalletNudge
  | typeof ModalName.PermissionsModal
  | typeof ModalName.PortfolioBalanceModal
  | typeof ModalName.About
  | typeof ModalName.BridgedAsset
  | typeof ModalName.Wormhole
  | typeof ModalName.ReportPortfolioData
  | typeof ModalName.ReportTokenIssue
  | typeof ModalName.ReportTokenData
  | typeof ModalName.EarnDepositReview
  | typeof ModalName.EarnVault
  | typeof ModalName.EarnYouNeedToken
>

type ModalNameWithComponentProps = {
  [ModalName.TestnetMode]: GetProps<typeof TestnetModeModal>
  [ModalName.HiddenTokenInfoModal]: GetProps<typeof HiddenTokenInfoModal>
  [ModalName.PasskeyManagement]: GetProps<typeof PasskeyManagementModal>
  [ModalName.SmartWalletNudge]: GetProps<typeof SmartWalletNudge>
  [ModalName.SmartWalletAdvancedSettingsModal]: GetProps<typeof SmartWalletAdvancedSettingsModal>
  [ModalName.SmartWalletEnabledModal]: GetProps<typeof SmartWalletEnabledModal>
  [ModalName.PermissionsModal]: GetProps<typeof PermissionsModal>
  [ModalName.PortfolioBalanceModal]: GetProps<typeof PortfolioBalanceModal>
  [ModalName.About]: GetProps<typeof AboutModal>
  [ModalName.BridgedAsset]: GetProps<typeof BridgedAssetModal>
  [ModalName.Wormhole]: GetProps<typeof WormholeModal>
  [ModalName.ReportPortfolioData]: GetProps<typeof ReportPortfolioDataModal>
  [ModalName.ReportTokenIssue]: GetProps<typeof ReportTokenIssueModal>
  [ModalName.ReportTokenData]: GetProps<typeof ReportTokenDataModal>
  [ModalName.EarnDepositReview]: GetProps<typeof EarnDepositReviewModal>
  [ModalName.EarnVault]: GetProps<typeof EarnVaultModal>
  [ModalName.EarnYouNeedToken]: GetProps<typeof EarnYouNeedTokenModal>
}

type NavigationModalProps<ModalName extends ValidModalNames> = {
  modalComponent: ComponentType<ModalNameWithComponentProps[ModalName]>
  route: AppStackScreenProp<ModalName>['route']
}

/**
 * A generic wrapper component that adapts a shared modal to work with React Navigation.
 */
function ReactNavigationModalInner<ModalName extends ValidModalNames>({
  modalComponent: ModalComponent,
  route,
}: NavigationModalProps<ModalName>): JSX.Element {
  const { onClose } = useReactNavigationModal()
  const params = (route.params ?? {}) as NonNullable<typeof route.params>

  return <ModalComponent {...params} isOpen onClose={onClose} />
}

export const ReactNavigationModal = memo(ReactNavigationModalInner)
