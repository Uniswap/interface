import { TokenAmount } from '@dynamic-amm/sdk'
import { CLAIM_REWARDS_DATA_URL, KNC } from 'constants/index'
import { BigNumber } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import useSWR from 'swr'
import { getClaimRewardContract } from 'utils'
import { t } from '@lingui/macro'
// eslint-disable react-hooks/exhaustive-deps
export default function useClaimReward() {
  const { chainId, account, library } = useActiveWeb3React()
  const rewardContract = useMemo(() => {
    return !!chainId && !!account && !!library ? getClaimRewardContract(chainId, library, account) : undefined
  }, [chainId, library, account])
  const isValid = !!chainId && !!account && !!library
  const [isUserHasReward, setIsUserHasReward] = useState(false)
  const [rewardAmounts, setRewardAmounts] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [phaseId, setPhaseId] = useState(0)
  const { data } = useSWR(isValid && chainId ? CLAIM_REWARDS_DATA_URL[chainId] : '', (url: string) =>
    fetch(url).then(r => r.json()),
  )
  const userRewards: any[] = useMemo(
    () =>
      (data &&
        Array.isArray(data) &&
        account &&
        data.map((phase: any) => {
          return { phaseId: phase.phaseId, tokens: phase.tokens, reward: phase.userRewards[account] }
        })) ||
      [],
    [data, account],
  )

  const updateRewardAmounts = useCallback(async () => {
    setRewardAmounts('0')
    setIsUserHasReward(userRewards && userRewards.some((phase: any) => !!phase.reward))
    if (rewardContract && chainId && data && account && userRewards.length > 0) {
      for (let i = 0; i < userRewards.length; i++) {
        const phase = userRewards[i]
        if (phase.reward) {
          const res = await rewardContract.getClaimedAmounts(phase.phaseId || 0, account || '', phase.tokens || [])
          if (res) {
            const remainAmounts = BigNumber.from(phase.reward.amounts[0])
              .sub(BigNumber.from(res[0]))
              .toString()
            setRewardAmounts(new TokenAmount(KNC[chainId], remainAmounts).toSignificant(6))
            if (remainAmounts !== '0') {
              setPhaseId(i)
              break
            }
          }
        }
      }
    }
  }, [rewardContract, chainId, data, account, userRewards])

  useEffect(() => {
    setRewardAmounts('0')
    if (data && chainId && account && library && userRewards) {
      updateRewardAmounts().catch(error => console.log(error))
    }
  }, [data, chainId, account, library, rewardContract, userRewards, updateRewardAmounts])

  const addTransactionWithType = useTransactionAdder()
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txHash, setTxHash] = useState(undefined)

  const allTransactions = useAllTransactions()
  const tx = useMemo(
    () =>
      Object.keys(allTransactions)
        .map(key => allTransactions[key])
        .filter(item => item.type === 'Claim reward' && !item.receipt)[0],
    [allTransactions],
  )
  const resetTxn = useCallback(() => {
    setAttemptingTxn(false)
    setTxHash(undefined)
    updateRewardAmounts()
    setError(null)
  }, [updateRewardAmounts])

  const hasPendingTx = !!tx
  useEffect(() => {
    if (!hasPendingTx) {
      resetTxn()
    }
  }, [hasPendingTx, resetTxn])

  const claimRewardsCallback = useCallback(() => {
    if (rewardContract && chainId && account && library && data && userRewards[phaseId]) {
      setAttemptingTxn(true)
      //execute isValidClaim method to pre-check
      rewardContract
        .isValidClaim(
          data.phaseId,
          userRewards[phaseId].index,
          account,
          data.tokens,
          userRewards[phaseId].amounts,
          userRewards[phaseId].proof,
        )
        .then((res: any) => {
          if (res) {
            return rewardContract.getClaimedAmounts(data.phaseId || 0, account || '', data?.tokens || [])
          } else {
            throw new Error()
          }
        })
        .then((res: any) => {
          if (res) {
            if (
              !BigNumber.from(userRewards[phaseId].amounts[0])
                .sub(BigNumber.from(res[0]))
                .isZero()
            ) {
              //if amount available for claim, execute claim method
              return rewardContract.claim(
                data.phaseId,
                userRewards[phaseId].index,
                account,
                data.tokens,
                userRewards[phaseId].amounts,
                userRewards[phaseId].proof,
              )
            } else {
              setRewardAmounts('0')
              throw new Error(t`Insufficient reward amount available for claim!`)
            }
          } else {
            throw new Error()
          }
        })
        .then((tx: any) => {
          setAttemptingTxn(false)
          setTxHash(tx.hash)
          addTransactionWithType(tx, {
            type: 'Claim reward',
            summary: rewardAmounts + ' KNC',
          })
        })
        .catch((err: any) => {
          //on invalid claim reward
          setAttemptingTxn(false)
          setError(err.message || t`Something is wrong. Please try again later!`)
        })
    }
  }, [
    rewardContract,
    chainId,
    account,
    library,
    data,
    rewardAmounts,
    JSON.stringify(userRewards[phaseId]),
    addTransactionWithType,
  ])

  return {
    isUserHasReward,
    rewardAmounts,
    claimRewardsCallback,
    attemptingTxn,
    txHash,
    resetTxn,
    pendingTx: !!tx && !tx.receipt,
    error,
  }
}
