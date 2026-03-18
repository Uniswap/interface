import { BigNumber } from '@ethersproject/bignumber'
import { useCallback } from 'react'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { useInterfaceMulticall } from '~/hooks/useContract'
import { useAppSelector } from '~/state/hooks'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'

// 5 minutes for L2 chains
const L2_DEADLINE_FROM_NOW = 60 * 5

/**
 * Returns an asynchronous function which will get the block timestamp and combine it with user settings for a deadline.
 * Should be used for any submitted transactions, as it uses an on-chain timestamp instead of a client timestamp.
 */
export function useGetTransactionDeadline(): () => Promise<BigNumber | undefined> {
  const { chainId } = useMultichainContext()
  const ttl = useAppSelector((state) => state.user.userDeadline)
  const multicall = useInterfaceMulticall(chainId)
  return useCallback(async () => {
    const blockTimestamp = await multicall.getCurrentBlockTimestamp()
    return timestampToDeadline({ chainId, blockTimestamp, ttl })
  }, [chainId, multicall, ttl])
}

function timestampToDeadline({
  chainId,
  blockTimestamp,
  ttl,
}: {
  chainId?: number
  blockTimestamp?: BigNumber
  ttl?: number
}) {
  if (blockTimestamp && isL2ChainId(chainId)) {
    return blockTimestamp.add(L2_DEADLINE_FROM_NOW)
  }
  if (blockTimestamp && ttl) {
    return blockTimestamp.add(ttl)
  }
  return undefined
}
