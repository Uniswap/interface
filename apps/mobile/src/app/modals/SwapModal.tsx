import { DdRum } from '@datadog/mobile-react-native'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BiometricsIconProps, useBiometricsIcon } from 'src/components/icons/useBiometricsIcon'
import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useOsBiometricAuthEnabled } from 'src/features/biometrics/useOsBiometricAuthEnabled'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { useHapticFeedback } from 'src/utils/haptics/useHapticFeedback'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import {
  SmartWalletDelegationAction,
  useSmartWalletDelegationStatus,
} from 'wallet/src/components/smartWallet/smartAccounts/hook'
import { selectShouldShowPostSwapNudge } from 'wallet/src/features/behaviorHistory/selectors'
import { setIncrementNumPostSwapNudge } from 'wallet/src/features/behaviorHistory/slice'
import { useIsChainSupportedBySmartWallet } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'
import { WalletState } from 'wallet/src/state/walletReducer'

/* Need to track the swap modal manually until it's integrated in to react-navigation */
const DATADOG_VIEW_KEY = 'global-swap-modal'

export function SwapModal(): JSX.Element {
  const appDispatch = useDispatch()
  const isSmartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)
  const { initialState } = useSelector(selectModalState(ModalName.Swap))
  const { hapticFeedback } = useHapticFeedback()
  const address = useActiveAccount()?.address
  const { status: delegationStatus, loading: delegationStatusLoading } = useSmartWalletDelegationStatus({})

  const onClose = useCallback((): void => {
    appDispatch(closeModal({ name: ModalName.Swap }))
    DdRum.stopView(DATADOG_VIEW_KEY, {}, Date.now()).catch(() => undefined)
  }, [appDispatch])

  // Update flow start timestamp every time modal is opened for logging
  useEffect(() => {
    const timestamp = Date.now()
    DdRum.startView(DATADOG_VIEW_KEY, ModalName.Swap, {}, timestamp).catch(() => undefined)
    appDispatch(updateSwapStartTimestamp({ timestamp }))
  }, [appDispatch])

  const { openWalletRestoreModal, walletRestoreType } = useWalletRestore()

  const swapPrefilledState = useSwapPrefilledState(initialState)

  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()
  const { trigger: biometricsTrigger } = useBiometricPrompt()
  const renderBiometricsIcon = useSwapBiometricsIcon()

  const canShowPostSwapNudge = useSelector((state: WalletState) =>
    address ? selectShouldShowPostSwapNudge(state, address) : false,
  )
  const isSupportedSmartWalletChain = useIsChainSupportedBySmartWallet(swapPrefilledState?.filteredChainIds.input)

  return (
    <WalletSwapFlow
      renderBiometricsIcon={renderBiometricsIcon}
      authTrigger={requiresBiometrics ? biometricsTrigger : undefined}
      openWalletRestoreModal={openWalletRestoreModal}
      prefilledState={swapPrefilledState}
      walletNeedsRestore={walletRestoreType === WalletRestoreType.NewDevice}
      onSubmitSwap={async () => {
        await hapticFeedback.success()

        if (!isSmartWalletEnabled || delegationStatusLoading) {
          return
        }

        if (
          address &&
          canShowPostSwapNudge &&
          delegationStatus === SmartWalletDelegationAction.PromptUpgrade &&
          isSupportedSmartWalletChain
        ) {
          navigate(ModalName.PostSwapSmartWalletNudge, {
            onEnableSmartWallet: () => {
              appDispatch(setSmartWalletConsent({ address, smartWalletConsent: true }))
              navigate(ModalName.SmartWalletEnabledModal, {
                showReconnectDappPrompt: false,
              })
            },
          })

          appDispatch(setIncrementNumPostSwapNudge({ walletAddress: address }))
        }
      }}
      onClose={onClose}
    />
  )
}

function useSwapBiometricsIcon(): (({ color }: BiometricsIconProps) => JSX.Element) | null {
  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { requiredForTransactions } = useBiometricAppSettings()
  const renderBiometricsIcon = useBiometricsIcon()

  if (isBiometricAuthEnabled && requiredForTransactions && renderBiometricsIcon) {
    return renderBiometricsIcon
  }

  return null
}
