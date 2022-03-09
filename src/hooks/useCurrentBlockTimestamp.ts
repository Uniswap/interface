import { BigNumber } from '@ethersproject/bignumber'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useState } from 'react'

import { useInterfaceMulticall } from './useContract'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(): BigNumber | undefined {
  const [lastBlock, setLastBlock] = useState<BigNumber | undefined>()
  const multicall = useInterfaceMulticall()
  const block: BigNumber | undefined = useSingleCallResult(multicall, 'getCurrentBlockTimestamp')?.result?.[0]
  useEffect(() => {
    // If block xor lastBlock are undefined, or if block has progressed, then update lastBlock.
    // This prevents updates when the block doesn't change, because the returned BigNumber will still be referentially unique.
    if (Boolean(block) !== Boolean(lastBlock) || (block && lastBlock && !block.eq(lastBlock))) {
      setLastBlock(block)
    }
  }, [block, lastBlock])
  return lastBlock
}
