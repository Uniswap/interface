import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { Token, TokenAmount } from '@uniswap/sdk'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from '@ethersproject/bignumber'

import { SWRKeys } from '.'
import { useTokenContract } from '../hooks'

function getTokenBalance(
  contract: Contract,
  token: Token
): (_: SWRKeys, __: number, ___: string, owner: string) => Promise<TokenAmount> {
  return async (_, __, ___, owner: string): Promise<TokenAmount> =>
    contract.balanceOf(owner).then((balance: { toString: () => string }) => new TokenAmount(token, balance.toString()))
}

export function useTokenBalance(token?: Token, owner?: string): TokenAmount {
  const contract = useTokenContract(token?.address, false)
  const shouldFetch = !!contract && typeof owner === 'string'

  const { data } = useSWR(
    shouldFetch ? [SWRKeys.TokenBalance, token.chainId, token.address, owner] : null,
    getTokenBalance(contract, token),
    {
      dedupingInterval: 10 * 1000,
      refreshInterval: 20 * 1000
    }
  )

  return data
}

function getETHBalance(library: Web3Provider): (_: SWRKeys, owner: string) => Promise<BigNumber> {
  return async (_, owner: string): Promise<BigNumber> => library.getBalance(owner)
}

export function useETHBalance(owner?: string): BigNumber {
  const { library } = useWeb3React()
  const shouldFetch = !!library && typeof owner === 'string'

  const { data } = useSWR(shouldFetch ? [SWRKeys.ETHBalance, owner] : null, getETHBalance(library), {
    dedupingInterval: 10 * 1000,
    refreshInterval: 20 * 1000
  })

  return data
}
