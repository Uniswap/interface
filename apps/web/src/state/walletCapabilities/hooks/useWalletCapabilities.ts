import { getCapabilities } from '@wagmi/core/experimental'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { setIsAtomicBatchingSupported } from 'state/walletCapabilities/reducer'
import { useAccountEffect } from 'wagmi'

const TIMEOUT_MS = 5000

export function useWalletCapabilities() {
  const dispatch = useAppDispatch()
  const isAtomicBatchingSupported = useAppSelector((state) => state.walletCapabilities.isAtomicBatchingSupported)

  // A successful response from getCapabilities indicates that the wallet supports atomic batching,
  // as this method is only available on wallets with atomic batching capabilities.
  const fetchCapabilities = useCallback(async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getCapabilities timeout')), TIMEOUT_MS),
    )

    try {
      // Race the getCapabilities call against the timeout
      const capabilities = await Promise.race([getCapabilities(wagmiConfig), timeoutPromise])

      // If we get capabilities within the timeout, update state accordingly
      dispatch(setIsAtomicBatchingSupported(!!capabilities))
    } catch (error) {
      // If the call times out or fails, assume no atomic batching support
      dispatch(setIsAtomicBatchingSupported(false))
    }
  }, [dispatch])

  useAccountEffect({
    onConnect() {
      fetchCapabilities()
    },
    onDisconnect() {
      dispatch(setIsAtomicBatchingSupported(false))
    },
  })

  return { isAtomicBatchingSupported, fetchCapabilities }
}
