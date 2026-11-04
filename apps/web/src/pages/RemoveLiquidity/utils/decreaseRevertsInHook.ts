import { areEvmAddressesEqual, isEVMChain } from '@universe/chains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { getInterfaceProvider } from '~/constants/providers'

// v4's PoolManager wraps every hook revert in WrappedError(address target, bytes4 selector, bytes reason,
// bytes details), with the hook as `target`: the selector, then `target` as the first 32-byte word.
const WRAPPED_ERROR_SELECTOR = '0x90bfb865'
const WRAPPED_ERROR_TARGET = { start: 10 + 24, end: 10 + 64 }

const HEX_DATA = /^0x[0-9a-f]+$/i

const MAX_ERROR_DEPTH = 5

/** The revert data an RPC error carries, wherever the provider nested it. */
function findRevertData(error: unknown, depth = 0): string | undefined {
  if (depth > MAX_ERROR_DEPTH || !error || typeof error !== 'object') {
    return undefined
  }
  if ('data' in error && typeof error.data === 'string' && HEX_DATA.test(error.data)) {
    return error.data
  }
  const inner = ('error' in error && error.error) || ('cause' in error && error.cause)
  return findRevertData(inner, depth + 1)
}

/** True only for revert data of a `WrappedError` raised by `hookAddress`; anything else proves nothing. */
export function isHookRevert(revertData: unknown, hookAddress: string): boolean {
  if (typeof revertData !== 'string' || !HEX_DATA.test(revertData) || revertData.length < WRAPPED_ERROR_TARGET.end) {
    return false
  }
  const target = `0x${revertData.slice(WRAPPED_ERROR_TARGET.start, WRAPPED_ERROR_TARGET.end)}`
  return revertData.slice(0, 10).toLowerCase() === WRAPPED_ERROR_SELECTOR && areEvmAddressesEqual(target, hookAddress)
}

/**
 * Simulates the decrease with an `eth_call` and reports whether it reverts inside the pool's hook. An RPC that
 * fails or is unavailable resolves to false: only a revert attributed to the hook counts.
 */
export async function decreaseRevertsInHook({
  tx,
  hookAddress,
}: {
  tx: { chainId: number; from?: string; to?: string; data?: string; value?: string }
  hookAddress: string
}): Promise<boolean> {
  const chainId = toSupportedChainId(tx.chainId)
  const provider = chainId && isEVMChain(chainId) ? getInterfaceProvider(chainId) : undefined
  if (!provider) {
    return false
  }
  try {
    // ethers v5 resolves, rather than rejects, a reverting eth_call with its revert data.
    const result = await provider.call({ from: tx.from, to: tx.to, data: tx.data, value: tx.value })
    return isHookRevert(result, hookAddress)
  } catch (error) {
    return isHookRevert(findRevertData(error), hookAddress)
  }
}
