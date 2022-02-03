import { BigNumber } from '@ethersproject/bignumber'
import { L2_CHAIN_IDS } from 'constants/chains'
import { DEFAULT_DEADLINE_FROM_NOW, L2_DEADLINE_FROM_NOW } from 'constants/misc'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useAtom } from 'jotai'
import { transactionTtlAtom } from 'lib/state/settings'
import { useMemo } from 'react'

import useActiveWeb3React from './useActiveWeb3React'

/** Returns the default transaction TTL for the chain, in minutes. */
export function useDefaultTransactionTtl(): number {
  const { chainId } = useActiveWeb3React()
  if (chainId && L2_CHAIN_IDS.includes(chainId)) return L2_DEADLINE_FROM_NOW / 60
  return DEFAULT_DEADLINE_FROM_NOW / 60
}

/** Returns the user-inputted transaction TTL, in minutes. */
export function useTransactionTtl(): [number | undefined, (ttl?: number) => void] {
  return useAtom(transactionTtlAtom)
}

// combines the block timestamp with the user setting to give the deadline that should be used for any submitted transaction
export default function useTransactionDeadline(): BigNumber | undefined {
  const [ttl] = useTransactionTtl()
  const defaultTtl = useDefaultTransactionTtl()

  const blockTimestamp = useCurrentBlockTimestamp()
  return useMemo(() => {
    if (!blockTimestamp) return undefined
    return blockTimestamp.add((ttl || defaultTtl) /* in seconds */ * 60)
  }, [blockTimestamp, defaultTtl, ttl])
}
