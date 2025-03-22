import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { AccountSwitcherModal } from 'src/app/modals/AccountSwitcherModal'
import { BackupReminderModal } from 'src/app/modals/BackupReminderModal'
import { BackupWarningModal } from 'src/app/modals/BackupWarningModal'
import { ExperimentsModal } from 'src/app/modals/ExperimentsModal'
import { ExploreModal } from 'src/app/modals/ExploreModal'
import { KoreaCexTransferInfoModal } from 'src/app/modals/KoreaCexTransferInfoModal'
import { LazyModalRenderer } from 'src/app/modals/LazyModalRenderer'
import { SendTokenModal } from 'src/app/modals/SendTokenModal'
import { SwapModal } from 'src/app/modals/SwapModal'
import { TokenWarningModalWrapper } from 'src/app/modals/TokenWarningModalWrapper'
import { ViewOnlyExplainerModal } from 'src/app/modals/ViewOnlyExplainerModal'
import { RemoveWalletModal } from 'src/components/RemoveWallet/RemoveWalletModal'
import { WalletConnectModals } from 'src/components/Requests/WalletConnectModals'
import { RestoreWalletModal } from 'src/components/RestoreWalletModal/RestoreWalletModal'
import { ForceUpgradeModal } from 'src/components/forceUpgrade/ForceUpgradeModal'
import { UnitagsIntroModal } from 'src/components/unitags/UnitagsIntroModal'
import { ExchangeTransferModal } from 'src/features/fiatOnRamp/ExchangeTransferModal'
import { FiatOnRampAggregatorModal } from 'src/features/fiatOnRamp/FiatOnRampAggregatorModal'
import { LockScreenModal } from 'src/features/lockScreen/LockScreenModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ScantasticModal } from 'src/features/scantastic/ScantasticModal'
import { TestnetSwitchModal } from 'src/features/testnetMode/TestnetSwitchModal'
import { ReceiveCryptoModal } from 'src/screens/ReceiveCryptoModal'
import { SettingsFiatCurrencyModal } from 'src/screens/SettingsFiatCurrencyModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SettingsLanguageModal } from 'wallet/src/components/settings/language/SettingsLanguageModal'
import { QueuedOrderModal } from 'wallet/src/features/transactions/swap/modals/QueuedOrderModal'

export function AppModals(): JSX.Element {
  const dispatch = useDispatch()

  const onCloseLanguageModal = useCallback(() => {
    dispatch(closeModal({ name: ModalName.LanguageSelector }))
  }, [dispatch])

  return (
    <>
      <LazyModalRenderer name={ModalName.KoreaCexTransferInfoModal}>
        <KoreaCexTransferInfoModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.ExchangeTransferModal}>
        <ExchangeTransferModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.Experiments}>
        <ExperimentsModal />
      </LazyModalRenderer>

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

      <QueuedOrderModal />

      <LazyModalRenderer name={ModalName.RemoveWallet}>
        <RemoveWalletModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.RestoreWallet}>
        <RestoreWalletModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.LanguageSelector}>
        <SettingsLanguageModal onClose={onCloseLanguageModal} />
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
