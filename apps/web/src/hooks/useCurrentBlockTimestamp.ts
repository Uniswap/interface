import { BigNumber } from '@ethersproject/bignumber'
import { ListenerOptions } from '@uniswap/redux-multicall'
import { useInterfaceMulticall } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMemo } from 'react'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(options?: ListenerOptions): BigNumber | undefined {
  const multicall = useInterfaceMulticall()
  const resultStr: string | undefined = useSingleCallResult(
    multicall,
    'getCurrentBlockTimestamp',
    undefined,
    options,
  )?.result?.[0]?.toString()
  return useMemo(() => (typeof resultStr === 'string' ? BigNumber.from(resultStr) : undefined), [resultStr])
}
