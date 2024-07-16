import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { AccountSwitcherModal } from 'src/app/modals/AccountSwitcherModal'
import { ExperimentsModal } from 'src/app/modals/ExperimentsModal'
import { ExploreModal } from 'src/app/modals/ExploreModal'
import { SwapModal } from 'src/app/modals/SwapModal'
import { TransferTokenModal } from 'src/app/modals/TransferTokenModal'
import { ViewOnlyExplainerModal } from 'src/app/modals/ViewOnlyExplainerModal'
import { LazyModalRenderer } from 'src/app/modals/utils'
import { RemoveWalletModal } from 'src/components/RemoveWallet/RemoveWalletModal'
import { WalletConnectModals } from 'src/components/Requests/WalletConnectModals'
import { RestoreWalletModal } from 'src/components/RestoreWalletModal/RestoreWalletModal'
import { ForceUpgradeModal } from 'src/components/forceUpgrade/ForceUpgradeModal'
import { UnitagsIntroModal } from 'src/components/unitags/UnitagsIntroModal'
import { LockScreenModal } from 'src/features/authentication/LockScreenModal'
import { ExchangeTransferModal } from 'src/features/fiatOnRamp/ExchangeTransferModal'
import { FiatOnRampAggregatorModal } from 'src/features/fiatOnRamp/FiatOnRampAggregatorModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ScantasticModal } from 'src/features/scantastic/ScantasticModal'
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
        <TransferTokenModal />
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
    </>
  )
}
