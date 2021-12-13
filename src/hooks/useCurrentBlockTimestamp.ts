import { BigNumber } from '@ethersproject/bignumber'
import { useEffect, useState } from 'react'

import { useSingleCallResult } from '../state/multicall/hooks'
import { useMulticall2Contract } from './useContract'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(): BigNumber | undefined {
  const [lastBlockTimestamp, setLastBlockTimestamp] = useState<BigNumber | undefined>(undefined)
  const multicall = useMulticall2Contract()
  const currentBlockTimestamp = useSingleCallResult(multicall, 'getCurrentBlockTimestamp')?.result?.[0]
  useEffect(() => {
    if (!lastBlockTimestamp?.eq(currentBlockTimestamp)) {
      setLastBlockTimestamp(currentBlockTimestamp)
    }
  }, [currentBlockTimestamp, lastBlockTimestamp])
  return lastBlockTimestamp
}
