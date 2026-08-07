import { useSyncExternalStore } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { wagmiConfig } from '~/connection/wagmiConfig'

const NOOP_UNSUBSCRIBE = () => {}

/** Whether the MetaMask extension is announced via EIP-6963 (i.e. installed in this browser). */
export function useIsMetaMaskExtensionDetected(): boolean {
  return useSyncExternalStore(
    (onChange) => wagmiConfig._internal.mipd?.subscribe(onChange) ?? NOOP_UNSUBSCRIBE,
    () => Boolean(wagmiConfig._internal.mipd?.findProvider({ rdns: CONNECTION_PROVIDER_IDS.METAMASK_RDNS })),
    () => false,
  )
}
