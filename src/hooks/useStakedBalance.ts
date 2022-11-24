import { BigNumber } from '@ethersproject/bignumber'
import { useCallback, useEffect, useState } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useBlockNumber } from 'state/application/hooks'

import { useFairLaunchContract } from './useContract'

interface BalanceProps {
  value: BigNumber
  decimals: number
}

const useStakedBalance = (contractAddress: string, pid: number, decimals = 18) => {
  // SLP is usually 18, KMP is 6
  const [balance, setBalance] = useState<BalanceProps>({ value: BigNumber.from(0), decimals: 18 })
  const { account } = useActiveWeb3React()
  const currentBlockNumber = useBlockNumber()
  const fairLaunchContract = useFairLaunchContract(contractAddress)

  const fetchBalance = useCallback(async () => {
    const getStaked = async (pid: number, owner: string | null | undefined): Promise<BalanceProps> => {
      try {
        const { amount } = await fairLaunchContract?.getUserInfo(pid, owner)
        return { value: BigNumber.from(amount), decimals: decimals }
      } catch (e) {
        return { value: BigNumber.from(0), decimals: decimals }
      }
    }
    const balance = await getStaked(pid, account)
    setBalance(balance)
  }, [account, decimals, fairLaunchContract, pid])

  useEffect(() => {
    if (account && fairLaunchContract) {
      fetchBalance()
    }
  }, [account, setBalance, currentBlockNumber, fetchBalance, fairLaunchContract])

  return balance
}

export default useStakedBalance
