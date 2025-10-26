import { getCapabilities as wagmi_getCapabilities } from '@wagmi/core/experimental'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { ensureValidatedCapabilities } from 'state/walletCapabilities/lib/ensureValidatedCapabilities'
import { ChainCapabilities, GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import { ensure0xHex, numberToHex } from 'utilities/src/addresses/hex'
import { getLogger } from 'utilities/src/logger/logger'

const TIMEOUT_MS = 5000

/**
 * [public] handleGetCapabilities -- gets the wallet capabilities for the current account
 * @returns the wallet capabilities for the current account
 */
export async function handleGetCapabilities(): Promise<GetCapabilitiesResult | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('getCapabilities timeout')), TIMEOUT_MS)
  })

  try {
    const capabilities = await Promise.race([walletGetCapabilities(), timeoutPromise])

    const validatedCapabilities = ensureValidatedCapabilities(capabilities)
    if (validatedCapabilities) {
      return validatedCapabilities
    } else {
      throw new Error(`Invalid capabilities format: ${JSON.stringify(capabilities)}`)
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('getCapabilities timeout')) {
      return null
    }
    getLogger().warn('useWalletCapabilities', 'handleGetCapabilities', `Error getting capabilities: ${error}`)
    return null
  } finally {
    // prevent memory leaks
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function walletGetCapabilities(): Promise<ReturnType<typeof wagmi_getCapabilities>> {
  return wagmi_getCapabilities(wagmiConfig)
}

enum AtomicBatchingStatus {
  Supported = 'supported',
  Ready = 'ready',
  Unsupported = 'unsupported',
}

export function isAtomicBatchingSupported(chainCapabilities: ChainCapabilities): boolean {
  return (
    chainCapabilities.atomic?.status === AtomicBatchingStatus.Supported ||
    chainCapabilities.atomic?.status === AtomicBatchingStatus.Ready
  )
}

export function isAtomicBatchingSupportedByChainId(
  chainCapabilitiesResult: GetCapabilitiesResult,
  chainId: number,
): boolean {
  const key = ensure0xHex(numberToHex(chainId))
  const chainCapabilities = chainCapabilitiesResult[key]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!chainCapabilities) {
    return false
  }
  return isAtomicBatchingSupported(chainCapabilities)
}

/**
 * Gets an array of chain IDs that support atomic batching
 * @param chainCapabilitiesResult The result from handleGetCapabilities
 * @returns Array of chain IDs (as numbers) that support atomic batching
 */
export function getAtomicSupportedChainIds(chainCapabilitiesResult: GetCapabilitiesResult | null): number[] {
  if (!chainCapabilitiesResult) {
    return []
  }

  return Object.entries(chainCapabilitiesResult)
    .filter(([_, capabilities]) => isAtomicBatchingSupported(capabilities))
    .map(([chainIdHex]) => parseInt(chainIdHex, 16))
}
