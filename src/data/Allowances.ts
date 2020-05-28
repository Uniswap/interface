import { Token, TokenAmount } from '@uniswap/sdk'
import { useMemo } from 'react'

import { useTokenContract } from '../hooks/useContract'
import { useContractData } from '../state/multicall/hooks'

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)

  const allowance = useContractData(contract?.interface, token?.address, 'allowance', [owner, spender])

  return useMemo(() => (token && allowance ? new TokenAmount(token, allowance.toString()) : undefined), [
    token,
    allowance
  ])
}
