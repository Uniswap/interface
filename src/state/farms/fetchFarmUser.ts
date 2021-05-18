import { useMemo } from 'react'
import { BigNumber } from '@ethersproject/bignumber'

import erc20ABI from 'constants/abis/erc20'
import { Farm } from './types'
import { useMasterChefContract } from 'hooks/useContract'
import { useMultipleContractSingleData, useSingleContractMultipleData } from 'state/multicall/hooks'

export const useFarmUserTokenBalances = (account: string | null | undefined, farmsToFetch: Farm[]) => {
  const lpContractAddresses = farmsToFetch.map(farm => farm.stakeToken)

  const rawTokenBalances = useMultipleContractSingleData(lpContractAddresses, erc20ABI, 'balanceOf', [
    account as string
  ])

  const anyLoading: boolean = useMemo(() => rawTokenBalances.some(callState => callState.loading), [rawTokenBalances])

  const parsedTokenBalances = rawTokenBalances.map(tokenBalance => {
    return tokenBalance?.result ? BigNumber.from(tokenBalance?.result?.[0]).toString() : undefined
  })

  return { loading: anyLoading, data: parsedTokenBalances }
}

export const useFarmUserAllowances = (account: string | null | undefined, farmsToFetch: Farm[]) => {
  const masterChefContract = useMasterChefContract()

  const lpContractAddresses = farmsToFetch.map(farm => farm.stakeToken)

  const rawLpAllowances = useMultipleContractSingleData(lpContractAddresses, erc20ABI, 'allowance', [
    account as string,
    masterChefContract?.address
  ])

  const anyLoading: boolean = useMemo(() => rawLpAllowances.some(callState => callState.loading), [rawLpAllowances])

  const parsedLpAllowances = rawLpAllowances.map((lpBalance: any) => {
    return lpBalance?.result ? BigNumber.from(lpBalance?.result?.[0]).toString() : undefined
  })

  return { loading: anyLoading, data: parsedLpAllowances }
}

export const useFarmUserStakedBalances = (account: string | null | undefined, farmsToFetch: Farm[]) => {
  const masterChefContract = useMasterChefContract()

  const rawStakedBalances = useSingleContractMultipleData(
    masterChefContract,
    'userInfo',
    farmsToFetch.map(farm => [farm.pid, account as string])
  )

  const anyLoading: boolean = useMemo(() => rawStakedBalances.some(callState => callState.loading), [rawStakedBalances])

  const parsedStakedBalances = rawStakedBalances.map((stakedBalance: any) => {
    return stakedBalance?.result ? BigNumber.from(stakedBalance?.result?.amount).toString() : undefined
  })

  return { loading: anyLoading, data: parsedStakedBalances }
}

export const useFarmUserEarnings = (account: string | null | undefined, farmsToFetch: Farm[]) => {
  const masterChefContract = useMasterChefContract()

  const rawEarnings = useSingleContractMultipleData(
    masterChefContract,
    'pendingReward',
    farmsToFetch.map(farm => [farm.pid, account as string])
  )

  const anyLoading: boolean = useMemo(() => rawEarnings.some(callState => callState.loading), [rawEarnings])

  const parsedEarnings = rawEarnings.map((earnings: any) => {
    return earnings?.result ? BigNumber.from(earnings?.result?.[0]).toString() : undefined
  })

  return { loading: anyLoading, data: parsedEarnings }
}
