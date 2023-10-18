import React from 'react'
import { AccountSwitcherModal } from 'src/app/modals/AccountSwitcherModal'
import { ExperimentsModal } from 'src/app/modals/ExperimentsModal'
import { ExploreModal } from 'src/app/modals/ExploreModal'
import { SwapModal } from 'src/app/modals/SwapModal'
import { TransferTokenModal } from 'src/app/modals/TransferTokenModal'
import { LazyModalRenderer } from 'src/app/modals/utils'
import { ForceUpgradeModal } from 'src/components/forceUpgrade/ForceUpgradeModal'
import { RemoveWalletModal } from 'src/components/RemoveWallet/RemoveWalletModal'
import { RestoreWalletModal } from 'src/components/RestoreWalletModal/RestoreWalletModal'
import { WalletConnectModals } from 'src/components/WalletConnect/WalletConnectModals'
import { LockScreenModal } from 'src/features/authentication/LockScreenModal'
import { FiatOnRampModal } from 'src/features/fiatOnRamp/FiatOnRampModal'
import { ModalName } from 'src/features/telemetry/constants'
import { SettingsFiatCurrencyModal } from 'src/screens/SettingsFiatCurrencyModal'
import { SettingsLanguageModal } from 'src/screens/SettingsLanguageModal'

export function AppModals(): JSX.Element {
  return (
    <>
      <LazyModalRenderer name={ModalName.Experiments}>
        <ExperimentsModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.FiatOnRamp}>
        <FiatOnRampModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.Explore}>
        <ExploreModal />
      </LazyModalRenderer>

      <ForceUpgradeModal />

      <LockScreenModal />

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

      <LazyModalRenderer name={ModalName.RemoveWallet}>
        <RemoveWalletModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.RestoreWallet}>
        <RestoreWalletModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.LanguageSelector}>
        <SettingsLanguageModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.FiatCurrencySelector}>
        <SettingsFiatCurrencyModal />
      </LazyModalRenderer>
    </>
  )
}
