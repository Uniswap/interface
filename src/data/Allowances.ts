import { Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useTokenContractForReading } from '../hooks/useContract'
import { useSingleCallResult } from '../state/multicall/hooks'

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const contractForReading = useTokenContractForReading(token?.address, false)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(contractForReading, 'allowance', inputs).result

  return useMemo(() => (token && allowance ? TokenAmount.fromRawAmount(token, allowance.toString()) : undefined), [
    token,
    allowance,
  ])
}
