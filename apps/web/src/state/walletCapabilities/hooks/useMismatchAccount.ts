import { nanoid } from '@reduxjs/toolkit'
import { getPublicClient } from '@wagmi/core'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { useRef } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { useIsAtomicBatchingSupportedByChainIdCallback } from 'state/walletCapabilities/hooks/useIsAtomicBatchingSupportedByChain'
import { useWalletGetCapabilitiesMutation } from 'state/walletCapabilities/hooks/useWalletGetCapabilitiesMutation'
import { isAtomicBatchingSupportedByChainId } from 'state/walletCapabilities/lib/handleGetCapabilities'
import { useUpdateDelegatedState } from 'state/wallets/hooks'
import { selectHasShownMismatchToast } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasShownMismatchToast } from 'uniswap/src/features/behaviorHistory/slice'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isDelegatedEOA } from 'uniswap/src/features/smartWallet/isDelegatedEOA'
import { createHasMismatchUtil } from 'uniswap/src/features/smartWallet/mismatch/mismatch'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send.web'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { isAddress } from 'viem'

/**
 * [private] useHasMismatchCallback -- gets the mismatch account status for the current account
 * @returns a stable callback that gets the mismatch account status for the current account
 */
export function useHasMismatchCallback(): (input: { address: string; chainId: number }) => Promise<boolean> {
  const updateDelegatedState = useUpdateDelegatedState()
  const { mutateAsync } = useWalletGetCapabilitiesMutation()
  const getIsAtomicBatchingSupportedByChainId = useIsAtomicBatchingSupportedByChainIdCallback()
  const isWalletGetCapabilitiesDisabled = useIsWalletGetCapabilitiesDisabled()

  // checks the bytecode of the wallet (if a contract is deployed)
  const getWalletBytecode = async (input: { address: string; chainId: number }) => {
    if (!isAddress(input.address)) {
      throw new Error('Invalid address')
    }

    // get the public client for the chain passed in
    const publicClient = getPublicClient(wagmiConfig, { chainId: input.chainId })

    if (!publicClient) {
      throw new Error('No public client set')
    }

    const result = await publicClient.getCode({ address: input.address as `0x${string}` })
    return result ?? '0x'
  }

  // checks if the wallet supports atomic batching via wallet capabilities
  const getIsAtomicBatchingSupported = async (input: { address: string; chainId: number }) => {
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

  // our callback that checks for mismatch
  return useEvent(async (input: { address: string; chainId: number }) => {
    const hasMismatchUtil = createHasMismatchUtil({
      logger: getLogger(),
      getIsAddressDelegated: async () => {
        const bytecode = await getWalletBytecode(input)
        const delegatedResult = isDelegatedEOA({ bytecode })
        if (!delegatedResult.isDelegated) {
          return {
            isDelegated: false,
            delegatedAddress: null,
          }
        }

        if (delegatedResult.delegateTo) {
          updateDelegatedState({ chainId: String(input.chainId), address: delegatedResult.delegateTo })
        }

        return {
          isDelegated: true,
          delegatedAddress: delegatedResult.delegateTo,
        }
      },
      getIsAtomicBatchingSupported: async () => getIsAtomicBatchingSupported(input),
      onMismatchDetected: (payload) => {
        sendAnalyticsEvent(UniswapEventName.SmartWalletMismatchDetected, {
          chainId: String(input.chainId),
          delegatedAddress: payload.delegatedAddress,
        })
      },
    })
    return hasMismatchUtil(input.address)
  })
}

/**
 * [private] useAllAcountChainMismatchMutation -- checks all account chain mismatch queries
 * @returns a mutation that checks all account chain mismatch queries
 */
export const useOnHasAnyMismatch = () => {
  // create a unique id for the toast when hook is created (so we only show one toast at a time)
  const toastId = useRef<string>(nanoid())
  const showMismatchToast = useShowMismatchToastCallback()
  return useEvent(() => {
    showMismatchToast({ id: toastId.current })
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
