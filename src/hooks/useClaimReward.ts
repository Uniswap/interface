import { ChainId, TokenAmount } from '@dynamic-amm/sdk'
import { CLAIM_REWARDS_DATA_URL, KNC } from 'constants/index'
import { BigNumber } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import useSWR from 'swr'
import { getClaimRewardContract } from 'utils'
import { t } from '@lingui/macro'

export default function useClaimReward() {
  const { chainId, account, library } = useActiveWeb3React()
  const rewardContract = useMemo(() => {
    return !!chainId && !!account && !!library ? getClaimRewardContract(chainId, library, account) : undefined
  }, [chainId, library, account])
  const isValid = !!chainId && !!account && !!library
  const [isUserHasReward, setIsUserHasReward] = useState(false)
  const [rewardAmounts, setRewardAmounts] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const { data } = useSWR(
    isValid ? (chainId === ChainId.ROPSTEN ? 'claim-reward-data.json' : CLAIM_REWARDS_DATA_URL) : '',
    (url: string) => fetch(url).then(r => r.json()),
  )
  const userReward = data && account && data.userRewards[account]

  const updateRewardAmounts = useCallback(() => {
    setRewardAmounts('0')
    setIsUserHasReward(!!userReward)
    if (rewardContract && chainId && userReward) {
      rewardContract.getClaimedAmounts(data?.phaseId || 0, account || '', data?.tokens || []).then((res: any) => {
        if (res) {
          const remainAmounts = BigNumber.from(userReward.amounts[0])
            .sub(BigNumber.from(res[0]))
            .toString()
          setRewardAmounts(new TokenAmount(KNC[chainId], remainAmounts).toSignificant(6))
        }
      })
    }
  }, [rewardContract, chainId, data, account, userReward])

  useEffect(() => {
    setRewardAmounts('0')
    if (data && chainId && account && library && userReward) {
      updateRewardAmounts()
    }
  }, [data, chainId, account, library, rewardContract, userReward, updateRewardAmounts])

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
    if (rewardContract && chainId && account && library && data && userReward) {
      setAttemptingTxn(true)
      //execute isValidClaim method to pre-check
      rewardContract
        .isValidClaim(data.phaseId, userReward.index, account, data.tokens, userReward.amounts, userReward.proof)
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
              !BigNumber.from(userReward.amounts[0])
                .sub(BigNumber.from(res[0]))
                .isZero()
            ) {
              //if amount available for claim, execute claim method
              return rewardContract.claim(
                data.phaseId,
                userReward.index,
                account,
                data.tokens,
                userReward.amounts,
                userReward.proof,
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
    userReward,
    userReward?.amounts,
    userReward?.index,
    userReward?.proof,
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
