import { BigNumber } from '@ethersproject/bignumber'
import { KNC, ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useRewardLockerContract } from './useContract'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useRewardTokensFullInfo } from 'utils/dmm'
import { ChainId, WETH } from 'libs/sdk/src'

const useVesting = () => {
  // SLP is usually 18, KMP is 6
  const addTransaction = useTransactionAdder()
  const [schedules, setSchedules] = useState([])
  const { account, chainId } = useActiveWeb3React()
  const currentBlockNumber = useBlockNumber()
  const lockerContract = useRewardLockerContract()
  const rewardTokens = useRewardTokensFullInfo()

  const fetchSchedules = useCallback(async () => {
    const getSchedules = async (address: string): Promise<any> => {
      try {
        console.log('rewardTokens', rewardTokens)
        const vt = rewardTokens.map(async t => {
          const res = await lockerContract?.getVestingSchedules(address, t.address)
          // [s1, s2]
          // res.map((s: any, index: any) => [...s, t, index])
          return res.map((s: any, index: any) => [...s, t, index]).flat()
        })
        return Promise.all(vt)
      } catch (e) {
        return []
      }
    }
    const schedules = !!chainId && !!account ? await getSchedules(account) : []
    setSchedules(schedules)
  }, [account, chainId, lockerContract])

  useEffect(() => {
    if (account && chainId && lockerContract) {
      fetchSchedules()
    }
  }, [account, setSchedules, currentBlockNumber, fetchSchedules, lockerContract])

  const vestAtIndex = useCallback(
    async (token: string, index: number[]) => {
      try {
        const tx = await lockerContract?.vestScheduleAtIndices(token, index)
        return addTransaction(tx, { summary: `Vest schedule ${index}` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [lockerContract, addTransaction]
  )
  return { schedules, vestAtIndex }
}

export default useVesting
