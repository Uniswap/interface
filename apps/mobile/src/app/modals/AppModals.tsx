import React from 'react'
import { LazyModalRenderer } from 'src/app/modals/LazyModalRenderer'
import { SendTokenModal } from 'src/app/modals/SendTokenModal'
import { ForceUpgradeModal } from 'src/components/forceUpgrade/ForceUpgradeModal'
import { WalletConnectModals } from 'src/components/Requests/WalletConnectModals'
import { FiatOnRampAggregatorModal } from 'src/features/fiatOnRamp/FiatOnRampAggregatorModal'
import { LockScreenModal } from 'src/features/lockScreen/LockScreenModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
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
  return (
    <>
      <LazyModalRenderer name={ModalName.FiatOnRampAggregator}>
        <FiatOnRampAggregatorModal />
      </LazyModalRenderer>

      <ForceUpgradeModal />

      <LockScreenModal />

      <LazyModalRenderer name={ModalName.Send}>
        <SendTokenModal />
      </LazyModalRenderer>

      <WalletConnectModals />

      <QueuedOrderModal />
    </>
  )
}
