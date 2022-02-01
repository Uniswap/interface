import { BigNumber } from '@ethersproject/bignumber'
import { L2_CHAIN_IDS } from 'constants/chains'
import { L2_DEADLINE_FROM_NOW } from 'constants/misc'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useAtomValue } from 'jotai/utils'
import { TRANSACTION_TTL_DEFAULT, transactionTtlAtom } from 'lib/state/settings'
import { useMemo } from 'react'

import useActiveWeb3React from './useActiveWeb3React'

// combines the block timestamp with the user setting to give the deadline that should be used for any submitted transaction
export default function useTransactionDeadline(): BigNumber | undefined {
  const { chainId } = useActiveWeb3React()
  const userDeadline: number = useAtomValue(transactionTtlAtom) || TRANSACTION_TTL_DEFAULT
  const blockTimestamp = useCurrentBlockTimestamp()
  return useMemo(() => {
    if (blockTimestamp && chainId && L2_CHAIN_IDS.includes(chainId)) return blockTimestamp.add(L2_DEADLINE_FROM_NOW)
    //@TODO(ianlapham): update this to be stored as seconds
    if (blockTimestamp && userDeadline) return blockTimestamp.add(userDeadline * 60) // adjust for seconds
    return undefined
  }, [blockTimestamp, chainId, userDeadline])
}
