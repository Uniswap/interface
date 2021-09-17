import { useActiveWeb3React } from 'hooks'
import { useCallback, useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import { useRewardLockerContract } from './useContract'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useRewardTokensFullInfo } from 'utils/dmm'

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
        const vt = rewardTokens
          .filter(t => !!t)
          .map(async t => {
            const res = await lockerContract?.getVestingSchedules(address, t.address)
            return res.map((s: any, index: any) => [...s, t, index])
          })
        return Promise.all(vt).then(res => res.flat())
      } catch (e) {
        return []
      }
    }
    const schedules = !!chainId && !!account ? await getSchedules(account) : []
    setSchedules(schedules)
  }, [account, chainId, lockerContract, rewardTokens])

  useEffect(() => {
    if (account && chainId && lockerContract) {
      fetchSchedules()
    }
  }, [account, setSchedules, currentBlockNumber, fetchSchedules, lockerContract, chainId, rewardTokens])

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

  const vestMultipleTokensAtIndices = useCallback(
    async (tokens: string[], indices: number[][]) => {
      try {
        const tx = await lockerContract?.vestScheduleForMultipleTokensAtIndices(tokens, indices)
        return addTransaction(tx, { summary: `Vest all` })
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [lockerContract, addTransaction]
  )
  return { schedules, vestAtIndex, vestMultipleTokensAtIndices }
}

export default useVesting
