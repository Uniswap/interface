import { TransactionResponse } from '@ethersproject/providers'
import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import { CLAIM_REWARDS_DATA_URL } from 'constants/index'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAllTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { getClaimRewardContract } from 'utils/getContract'

export interface IReward {
  index: number
  amounts: string[]
  proof: string[]
}
export interface IPhaseData {
  phaseId: number
  merkleRoot: string
  tokens: string[]
  userRewards: { [address: string]: IReward }
}
export interface IUserReward {
  phaseId: number
  tokens: string[]
  reward: IReward | undefined
}

export default function useClaimReward() {
  const { chainId, account } = useActiveWeb3React()
  const { library } = useWeb3React()

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
  const userRewards: IUserReward[] = useMemo(
    () =>
      (data &&
        Array.isArray(data) &&
        account &&
        data.map((phase: IPhaseData) => {
          return { phaseId: phase.phaseId, tokens: phase.tokens, reward: phase.userRewards[account] }
        })) ||
      [],
    [data, account],
  )

  const updateRewardAmounts = useCallback(async () => {
    setRewardAmounts('0')
    setIsUserHasReward(userRewards && userRewards.some((phase: IUserReward) => !!phase.reward))
    if (rewardContract && chainId && data && account && userRewards.length > 0) {
      for (let i = 0; i < userRewards.length; i++) {
        const phase = userRewards[i]
        if (phase.reward) {
          const res = await rewardContract.getClaimedAmounts(phase.phaseId || 0, account || '', phase.tokens || [])
          if (res) {
            const remainAmounts = BigNumber.from(phase.reward.amounts[0]).sub(BigNumber.from(res[0])).toString()
            setRewardAmounts(CurrencyAmount.fromRawAmount(KNC[chainId], remainAmounts).toSignificant(6))
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
  const [txHash, setTxHash] = useState<string | undefined>(undefined)

  const allTransactions = useAllTransactions()
  const tx = useMemo(
    () =>
      allTransactions
        ? Object.values(allTransactions)
            .flat()
            .find(item => item && item.type === TRANSACTION_TYPE.CLAIM_REWARD && !item.receipt)
        : undefined,
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
      const userReward = userRewards[phaseId]
      rewardContract
        .isValidClaim(
          userReward.phaseId,
          userReward.reward?.index,
          account,
          userReward.tokens,
          userReward.reward?.amounts,
          userReward.reward?.proof,
        )
        .then((res: boolean) => {
          if (res) {
            return rewardContract.getClaimedAmounts(data.phaseId || 0, account || '', data?.tokens || [])
          } else {
            throw new Error()
          }
        })
        .then((res: number[]) => {
          if (res) {
            if (
              res.length === 0 ||
              !BigNumber.from(userReward.reward?.amounts[0]).sub(BigNumber.from(res[0])).isZero()
            ) {
              //if amount available for claim, execute claim method
              return rewardContract.claim(
                userReward.phaseId,
                userReward.reward?.index,
                account,
                userReward.tokens,
                userReward.reward?.amounts,
                userReward.reward?.proof,
              )
            } else {
              setRewardAmounts('0')
              throw new Error(t`Insufficient reward amount available for claim!`)
            }
          } else {
            throw new Error()
          }
        })
        .then((tx: TransactionResponse) => {
          setAttemptingTxn(false)
          setTxHash(tx.hash)
          addTransactionWithType({
            hash: tx.hash,
            type: TRANSACTION_TYPE.CLAIM_REWARD,
            extraInfo: {
              tokenAddress: KNC[chainId].address,
              tokenAmount: rewardAmounts,
              tokenSymbol: 'KNC',
            },
          })
        })
        .catch((err: any) => {
          //on invalid claim reward
          setAttemptingTxn(false)
          const e = new Error('Claim Reward error', { cause: err })
          e.name = 'ClaimRewardError'
          captureException(e)

          setError(err.message || t`Something is wrong. Please try again later!`)
        })
    }
  }, [rewardContract, chainId, account, library, data, rewardAmounts, phaseId, userRewards, addTransactionWithType])

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
