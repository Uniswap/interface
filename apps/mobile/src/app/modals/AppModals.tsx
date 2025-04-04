import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { AccountSwitcherModal } from 'src/app/modals/AccountSwitcherModal'
import { BackupReminderModal } from 'src/app/modals/BackupReminderModal'
import { BackupWarningModal } from 'src/app/modals/BackupWarningModal'
import { ExploreModal } from 'src/app/modals/ExploreModal'
import { LazyModalRenderer } from 'src/app/modals/LazyModalRenderer'
import { SendTokenModal } from 'src/app/modals/SendTokenModal'
import { SwapModal } from 'src/app/modals/SwapModal'
import { TokenWarningModalWrapper } from 'src/app/modals/TokenWarningModalWrapper'
import { ViewOnlyExplainerModal } from 'src/app/modals/ViewOnlyExplainerModal'
import { RemoveWalletModal } from 'src/components/RemoveWallet/RemoveWalletModal'
import { WalletConnectModals } from 'src/components/Requests/WalletConnectModals'
import { RestoreWalletModal } from 'src/components/RestoreWalletModal/RestoreWalletModal'
import { ConnectionsDappListModal } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappListModal'
import { EditLabelSettingsModal } from 'src/components/Settings/EditWalletModal/EditLabelSettingsModal'
import { EditProfileSettingsModal } from 'src/components/Settings/EditWalletModal/EditProfileSettingsModal'
import { ManageWalletsModal } from 'src/components/Settings/ManageWalletsModal'
import { SettingsAppearanceModal } from 'src/components/Settings/SettingsAppearanceModal'
import { SettingsBiometricModal } from 'src/components/Settings/SettingsBiometricModal'
import { ForceUpgradeModal } from 'src/components/forceUpgrade/ForceUpgradeModal'
import { UnitagsIntroModal } from 'src/components/unitags/UnitagsIntroModal'
import { FiatOnRampAggregatorModal } from 'src/features/fiatOnRamp/FiatOnRampAggregatorModal'
import { LockScreenModal } from 'src/features/lockScreen/LockScreenModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ScantasticModal } from 'src/features/scantastic/ScantasticModal'
import { TestnetSwitchModal } from 'src/features/testnetMode/TestnetSwitchModal'
import { ReceiveCryptoModal } from 'src/screens/ReceiveCryptoModal'
import { SettingsFiatCurrencyModal } from 'src/screens/SettingsFiatCurrencyModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SettingsLanguageModal } from 'wallet/src/components/settings/language/SettingsLanguageModal'
import { PermissionsModal } from 'wallet/src/components/settings/permissions/PermissionsModal'
import { PortfolioBalanceModal } from 'wallet/src/components/settings/portfolioBalance/PortfolioBalanceModal'
import { QueuedOrderModal } from 'wallet/src/features/transactions/swap/modals/QueuedOrderModal'

export function AppModals(): JSX.Element {
  const dispatch = useDispatch()

  const onCloseLanguageModal = useCallback(() => {
    dispatch(closeModal({ name: ModalName.LanguageSelector }))
  }, [dispatch])

  const onClosePortfolioBalanceModal = useCallback(() => {
    dispatch(closeModal({ name: ModalName.PortfolioBalanceModal }))
  }, [dispatch])

  const onClosePermissionsModal = useCallback(() => {
    dispatch(closeModal({ name: ModalName.PermissionsModal }))
  }, [dispatch])

  return (
    <>
      <LazyModalRenderer name={ModalName.FiatOnRampAggregator}>
        <FiatOnRampAggregatorModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.ReceiveCryptoModal}>
        <ReceiveCryptoModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.Explore}>
        <ExploreModal />
      </LazyModalRenderer>

      <ForceUpgradeModal />

      <LockScreenModal />

      <LazyModalRenderer name={ModalName.Scantastic}>
        <ScantasticModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.Swap}>
        <SwapModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.Send}>
        <SendTokenModal />
      </LazyModalRenderer>

      <WalletConnectModals />

      <LazyModalRenderer name={ModalName.AccountSwitcher}>
        <AccountSwitcherModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.ManageWalletsModal}>
        <ManageWalletsModal />
      </LazyModalRenderer>

      <QueuedOrderModal />

      <LazyModalRenderer name={ModalName.RemoveWallet}>
        <RemoveWalletModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.ConnectionsDappListModal}>
        <ConnectionsDappListModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.EditLabelSettingsModal}>
        <EditLabelSettingsModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.EditProfileSettingsModal}>
        <EditProfileSettingsModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.RestoreWallet}>
        <RestoreWalletModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.LanguageSelector}>
        <SettingsLanguageModal onClose={onCloseLanguageModal} />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.PortfolioBalanceModal}>
        <PortfolioBalanceModal onClose={onClosePortfolioBalanceModal} />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.PermissionsModal}>
        <PermissionsModal onClose={onClosePermissionsModal} />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.SettingsAppearance}>
        <SettingsAppearanceModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.BiometricsModal}>
        <SettingsBiometricModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.FiatCurrencySelector}>
        <SettingsFiatCurrencyModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.UnitagsIntro}>
        <UnitagsIntroModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.ViewOnlyExplainer}>
        <ViewOnlyExplainerModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.BackupReminder}>
        <BackupReminderModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.BackupReminderWarning}>
        <BackupWarningModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.TokenWarning}>
        <TokenWarningModalWrapper />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.TestnetSwitchModal}>
        <TestnetSwitchModal />
      </LazyModalRenderer>
    </>
  )
}
