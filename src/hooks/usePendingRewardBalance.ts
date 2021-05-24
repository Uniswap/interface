import { BigNumber } from '@ethersproject/bignumber'
import { useActiveWeb3React } from 'hooks'
import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useMasterChefContract } from './useContract'

export interface BalanceProps {
  value: BigNumber
  decimals: number
}

const usePendingRewardBalance = (pid: number, decimals = 18) => {
  // SLP is usually 18, KMP is 6
  const [balance, setBalance] = useState<BalanceProps>({ value: BigNumber.from(0), decimals: 18 })
  const { account } = useActiveWeb3React()
  const currentBlockNumber = useBlockNumber()
  const masterChefContract = useMasterChefContract()

  const fetchBalance = useCallback(async () => {
    const getReward = async (pid: number, owner: string | null | undefined): Promise<BalanceProps> => {
      try {
        const amount = await masterChefContract?.pendingReward(pid, owner)
        return { value: BigNumber.from(amount), decimals: decimals }
      } catch (e) {
        console.log('===ownerrreeeee', e.toString())
        return { value: BigNumber.from(0), decimals: decimals }
      }
    }
    const balance = await getReward(pid, account)
    setBalance(balance)
  }, [account, decimals, masterChefContract, pid])

  useEffect(() => {
    if (account && masterChefContract) {
      fetchBalance()
    }
  }, [account, setBalance, currentBlockNumber, fetchBalance, masterChefContract])

  return balance
}

export default usePendingRewardBalance
