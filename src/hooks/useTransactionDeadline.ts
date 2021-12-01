import { BigNumber } from '@ethersproject/bignumber'
import { L2_CHAIN_IDS } from 'constants/chains'
import { L2_DEADLINE_FROM_NOW } from 'constants/misc'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'

import useCurrentBlockTimestamp from './useCurrentBlockTimestamp'
import { useActiveWeb3React } from './web3'

// combines the block timestamp with the user setting to give the deadline that should be used for any submitted transaction
export default function useTransactionDeadline(): BigNumber | undefined {
  const { chainId } = useActiveWeb3React()
  const ttl = useAppSelector((state) => state.user.userDeadline)
  const blockTimestamp = useCurrentBlockTimestamp()
  return useMemo(() => {
    if (blockTimestamp && chainId && L2_CHAIN_IDS.includes(chainId)) return blockTimestamp.add(L2_DEADLINE_FROM_NOW)
    if (blockTimestamp && ttl) return blockTimestamp.add(ttl)
    return undefined
  }, [blockTimestamp, chainId, ttl])
}
