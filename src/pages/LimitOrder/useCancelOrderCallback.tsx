import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import { ChainId } from '@ubeswap/sdk'
import { useDoTransaction } from 'components/swap/routing'
import { useMemo } from 'react'

import { executeCancelOrder } from './executCancelOrder'

/**
 * Use callback to cancel open limit order
 * @param orderHash the hash of the order to cancel
 * @returns
 */
export const useCancelOrderCallback = (
  orderHash: string | undefined // orderHash of order to cancel
): { callback: null | (() => Promise<string>); error: string | null } => {
  const { address: account, network } = useContractKit()
  const library = useProvider()
  const chainId = network.chainId as unknown as ChainId
  const doTransaction = useDoTransaction()

  return useMemo(() => {
    if (!library || !orderHash || !account) {
      return { callback: null, error: 'Missing dependencies' }
    }

    if (chainId === ChainId.BAKLAVA) {
      return { callback: null, error: 'Baklava is not supported' }
    }

    const signer = library.getSigner(account)
    const env = { signer, chainId, doTransaction }

    return {
      callback: async () => (await executeCancelOrder({ ...env, orderHash })).hash,
      error: null,
    }
  }, [library, chainId, doTransaction, orderHash, account])
}
