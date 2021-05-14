import { Token, TokenAmount } from 'dxswap-sdk'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import ERC20_INTERFACE from '../constants/abis/erc20'

import { useMulticallContract, useTokenContract } from '../hooks/useContract'
import {
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData
} from '../state/multicall/hooks'

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(contract, 'allowance', inputs).result

  return useMemo(() => (token && allowance ? new TokenAmount(token, allowance.toString()) : undefined), [
    token,
    allowance
  ])
}

export function useTokenAllowances(
  tokens?: Token[] | undefined,
  owner?: string,
  spender?: string
): TokenAmount[] | undefined {
  const multicall = useMulticallContract()
  const rawAllowances = useMultipleContractSingleData(
    (tokens || []).map(token => token.address),
    ERC20_INTERFACE,
    'allowance(address,address)',
    [owner, spender]
  )

  return useMemo(() => {
    if (!multicall || !tokens || tokens.length === 0 || !rawAllowances || rawAllowances.length === 0) return
    const pendingCall = rawAllowances.find(call => call.loading || !call.result)
    if (pendingCall) {
      return undefined
    }
    return rawAllowances.map((call, index) => {
      const relatedToken = tokens[index]
      if (!call.result) {
        return new TokenAmount(relatedToken, '0')
      }
      const allowance = call.result[0] as BigNumber
      return new TokenAmount(relatedToken, allowance.toString())
    })
  }, [multicall, tokens, rawAllowances])
}

export function useTokenAllowancesForMultipleSpenders(
  token?: Token,
  owner?: string,
  spenders?: string[]
): TokenAmount[] | undefined {
  const contract = useTokenContract(token?.address, false)

  const inputs = useMemo(() => {
    if (spenders && spenders.length > 0 && !!owner) return spenders.map(spender => [owner, spender])
    return []
  }, [owner, spenders])
  const allowances = useSingleContractMultipleData(contract, 'allowance', inputs)

  return useMemo(() => {
    if (!token) return undefined
    return allowances.map(allowance => new TokenAmount(token, allowance.result?.[0] ?? '0'))
  }, [token, allowances])
}
