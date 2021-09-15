import { Token, TokenAmount } from 'libs/sdk/src'
import { Token as TokenUNI, TokenAmount as TokenAmountUNI } from '@uniswap/sdk'
import { Token as TokenSUSHI, TokenAmount as TokenAmountSUSHI } from '@sushiswap/sdk'
import { useMemo } from 'react'

import { useTokenContract, useTokenContractForReading } from '../hooks/useContract'
import { useSingleCallResult } from '../state/multicall/hooks'

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const contractForReading = useTokenContractForReading(token?.address, false)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(contractForReading, 'allowance', inputs).result

  return useMemo(() => (token && allowance ? new TokenAmount(token, allowance.toString()) : undefined), [
    token,
    allowance
  ])
}

export function useTokenAllowanceUNI(token?: TokenUNI, owner?: string, spender?: string): TokenAmountUNI | undefined {
  const contract = useTokenContract(token?.address, false)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(contract, 'allowance', inputs).result

  return useMemo(() => (token && allowance ? new TokenAmountUNI(token, allowance.toString()) : undefined), [
    token,
    allowance
  ])
}

export function useTokenAllowanceSUSHI(
  token?: TokenSUSHI,
  owner?: string,
  spender?: string
): TokenAmountSUSHI | undefined {
  const contract = useTokenContract(token?.address, false)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(contract, 'allowance', inputs).result

  return useMemo(() => (token && allowance ? new TokenAmountSUSHI(token, allowance.toString()) : undefined), [
    token,
    allowance
  ])
}
