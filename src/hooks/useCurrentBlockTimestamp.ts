import { BigNumber } from '@ethersproject/bignumber'
import { useSingleCallResult } from 'lib/hooks/multicall'

import { useInterfaceMulticall } from './useContract'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(): BigNumber | undefined {
  const multicall = useInterfaceMulticall()
  return useSingleCallResult(multicall, 'getCurrentBlockTimestamp')?.result?.[0]
}
