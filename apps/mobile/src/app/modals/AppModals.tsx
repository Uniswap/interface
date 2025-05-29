import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { LazyModalRenderer } from 'src/app/modals/LazyModalRenderer'
import { SendTokenModal } from 'src/app/modals/SendTokenModal'
import { SwapModal } from 'src/app/modals/SwapModal'
import { WalletConnectModals } from 'src/components/Requests/WalletConnectModals'
import { SettingsAppearanceModal } from 'src/components/Settings/SettingsAppearanceModal'
import { ForceUpgradeModal } from 'src/components/forceUpgrade/ForceUpgradeModal'
import { FiatOnRampAggregatorModal } from 'src/features/fiatOnRamp/FiatOnRampAggregatorModal'
import { LockScreenModal } from 'src/features/lockScreen/LockScreenModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SettingsLanguageModal } from 'wallet/src/components/settings/language/SettingsLanguageModal'
import { PermissionsModal } from 'wallet/src/components/settings/permissions/PermissionsModal'
import { PortfolioBalanceModal } from 'wallet/src/components/settings/portfolioBalance/PortfolioBalanceModal'
import { QueuedOrderModal } from 'wallet/src/features/transactions/swap/modals/QueuedOrderModal'

/**
 * *********** DEPRECATION NOTICE ***********
 *
 * This modal system is deprecated in favor of React Navigation.
 * Please do not add any new modals to this redux slice.
 * See apps/mobile/src/app/navigation/navigation.tsx
 *
 * *********** DEPRECATION NOTICE ***********
 */

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

      <ForceUpgradeModal />

      <LockScreenModal />

      <LazyModalRenderer name={ModalName.Swap}>
        <SwapModal />
      </LazyModalRenderer>

      <LazyModalRenderer name={ModalName.Send}>
        <SendTokenModal />
      </LazyModalRenderer>

      <WalletConnectModals />

      <QueuedOrderModal />

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
    </>
  )
}
