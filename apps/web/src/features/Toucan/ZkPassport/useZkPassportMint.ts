import type { UniverseChainId } from '@universe/chains'
import type { createVerification, VerificationController } from '@zkpassport/ui/button'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'
import { assume0xAddress } from '~/chains'

type ZkPassportSdk = { createVerification: typeof createVerification }

// The SDK loads ahead of the click: a browser only opens the ZKPassport popup from a synchronous click handler.
let sdk: ZkPassportSdk | undefined
let sdkRequest: Promise<void> | undefined
const listeners = new Set<() => void>()

function loadSdk(): void {
  sdkRequest ??= import('@zkpassport/ui/button')
    .then((module) => {
      sdk = module
      listeners.forEach((listener) => listener())
    })
    .catch((error: unknown) => {
      sdkRequest = undefined
      logger.warn('useZkPassportMint', 'loadSdk', 'Failed to load the ZKPassport SDK', { error })
    })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSdk(): ZkPassportSdk | undefined {
  return sdk
}

// The user declining or closing the popup arrives as an error too; only the rest are worth reporting.
const USER_ENDED_ERROR_KINDS = new Set(['rejected', 'closed'])

/**
 * Opens ZKPassport to mint the credential `policyId` defines to `walletAddress`, or undefined until it can:
 * without a policy, chain or wallet, or while the SDK loads. `onSettled` runs once the popup finishes either way.
 */
export function useZkPassportMint({
  policyId,
  chainId,
  walletAddress,
  onSettled,
}: {
  /** 32-byte hex policy id */
  policyId: string | undefined
  chainId: UniverseChainId | undefined
  walletAddress: string | undefined
  onSettled: () => void
}): (() => void) | undefined {
  useEffect(() => {
    if (policyId) {
      loadSdk()
    }
  }, [policyId])
  const zkPassport = useSyncExternalStore(subscribe, getSdk)

  // One controller per policy and wallet: its verify() refocuses an open popup, where a new controller would reload it
  // and drop a mint in progress.
  const controller = useMemo((): VerificationController | undefined => {
    if (!zkPassport || !policyId || !chainId || !walletAddress) {
      return undefined
    }
    return zkPassport.createVerification(
      () => ({
        mint: true,
        policyId: `eip155:${chainId}:${policyId}`,
        bind: { account: assume0xAddress(walletAddress), chainId },
        onSuccess: onSettled,
        onError: (error) => {
          // A popup closed after it submitted the mint still minted, so read the credential either way.
          onSettled()
          if (!USER_ENDED_ERROR_KINDS.has(error.kind)) {
            logger.warn('useZkPassportMint', 'onError', 'ZKPassport verification failed', {
              kind: error.kind,
              message: error.message,
            })
          }
        },
      }),
      noop,
    )
  }, [zkPassport, policyId, chainId, walletAddress, onSettled])

  useEffect(() => () => controller?.dispose(), [controller])

  return useMemo(() => controller && (() => controller.verify()), [controller])
}
