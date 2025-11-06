import { nanoid } from '@reduxjs/toolkit'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useRef } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useIsAtomicBatchingSupportedByChainIdCallback } from 'state/walletCapabilities/hooks/useIsAtomicBatchingSupportedByChain'
import { useWalletGetCapabilitiesMutation } from 'state/walletCapabilities/hooks/useWalletGetCapabilitiesMutation'
import { isAtomicBatchingSupportedByChainId } from 'state/walletCapabilities/lib/handleGetCapabilities'
import { useDelegationService } from 'state/wallets/useDelegationService'
import { selectHasShownMismatchToast } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasShownMismatchToast } from 'uniswap/src/features/behaviorHistory/slice'
import { createHasMismatchUtil, type HasMismatchUtil } from 'uniswap/src/features/smartWallet/mismatch/mismatch'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * [public] useHasMismatchCallback -- gets the mismatch account status for the current account
 * @returns a stable callback that gets the mismatch account status for the current account
 */
export function useHasMismatchCallback(): HasMismatchUtil {
  const { mutateAsync } = useWalletGetCapabilitiesMutation()
  const getIsAtomicBatchingSupportedByChainId = useIsAtomicBatchingSupportedByChainIdCallback()
  const isWalletGetCapabilitiesDisabled = useIsWalletGetCapabilitiesDisabled()
  const delegationService = useDelegationService()

  // checks if the wallet supports atomic batching via wallet capabilities
  const getIsAtomicBatchingSupported = async (input: { chainId: number }) => {
    if (isWalletGetCapabilitiesDisabled) {
      return false
    }
    const isAtomicBatchingSupported = getIsAtomicBatchingSupportedByChainId(input.chainId)
    // if the wallet capabilities are already known, use that to prevent unnecessary re-fetching
    if (isAtomicBatchingSupported !== undefined) {
      return isAtomicBatchingSupported
    }
    try {
      const result = await mutateAsync()
      if (result) {
        return isAtomicBatchingSupportedByChainId(result, input.chainId)
      }
      return false
    } catch (error) {
      getLogger().error(error, {
        tags: {
          file: 'useMismatchAccount.ts',
          function: 'getIsAtomicBatchingSupported',
        },
      })
      return false
    }
  }

  const onMismatchDetected = useEvent(
    (payload: { chainId: number; isDelegated: boolean; delegatedAddress: Address }) => {
      sendAnalyticsEvent(UniswapEventName.SmartWalletMismatchDetected, {
        chainId: String(payload.chainId),
        delegatedAddress: payload.delegatedAddress,
      })
    },
  )

  // our callback that checks for mismatch
  return useEvent(
    createHasMismatchUtil({
      logger: getLogger(),
      delegationService,
      getIsAtomicBatchingSupported,
      onMismatchDetected,
    }),
  )
}

/**
 * [private] useAllAcountChainMismatchMutation -- checks all account chain mismatch queries
 * @returns a mutation that checks all account chain mismatch queries
 */
export const useShowMismatchToast = () => {
  const isPermitMismatchUxEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  // create a unique id for the toast when hook is created (so we only show one toast at a time)
  const toastId = useRef<string>(nanoid())
  const showMismatchToast = useShowMismatchToastCallback()
  return useEvent(() => {
    if (isPermitMismatchUxEnabled) {
      showMismatchToast({ id: toastId.current })
    }
  })
}

/**
 * [private] useShowMismatchToastCallback -- shows the mismatch toast
 * @returns a stable callback that shows the mismatch toast
 */
function useShowMismatchToastCallback(): (input: { id: string }) => void {
  const hasShownMismatchToast = useAppSelector(selectHasShownMismatchToast)
  const dispatch = useAppDispatch()
  return useEvent((input: { id: string }) => {
    // only show the toast if it hasn't been shown yet
    if (!hasShownMismatchToast) {
      showMismatchToast(input)
      dispatch(setHasShownMismatchToast(true))
    }
  })
}

/**
 * [private] showMismatchToast -- shows the mismatch toast
 * @param input - the input object: id (unique id for the toast)
 */
function showMismatchToast(input: { id: string }): void {
  const key = `mismatch-${input.id}`
  popupRegistry.addPopup(
    {
      type: PopupType.Mismatch,
    },
    key,
    Infinity,
  )
}

function useIsWalletGetCapabilitiesDisabled(): boolean {
  return useFeatureFlag(FeatureFlags.ForceDisableWalletGetCapabilities)
}
