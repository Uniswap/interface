import { ChainId } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { useLocalStorage } from 'react-use'
import useSWR from 'swr'
import useSWRImmutable from 'swr/immutable'

import DaoABI from 'constants/abis/kyberdao/dao.json'
import MigrateABI from 'constants/abis/kyberdao/migrate.json'
import RewardDistributorABI from 'constants/abis/kyberdao/reward_distributor.json'
import StakingABI from 'constants/abis/kyberdao/staking.json'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { NETWORKS_INFO, NETWORKS_INFO_CONFIG, isEVM } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useContract } from 'hooks/useContract'
import useTokenBalance from 'hooks/useTokenBalance'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { calculateGasMargin } from 'utils'

import { ProposalDetail, ProposalStatus, StakerAction, StakerInfo, VoteInfo } from './types'

export function isSupportKyberDao(chainId: ChainId) {
  return isEVM(chainId) && (NETWORKS_INFO_CONFIG[chainId] as EVMNetworkInfo).kyberDAO
}

export function useKyberDAOInfo() {
  const { chainId } = useActiveWeb3React()
  const kyberDaoInfo = NETWORKS_INFO[chainId !== ChainId.GÖRLI ? ChainId.MAINNET : ChainId.GÖRLI].kyberDAO
  return kyberDaoInfo
}

export function useKyberDaoStakeActions() {
  const addTransactionWithType = useTransactionAdder()
  const kyberDaoInfo = useKyberDAOInfo()
  const stakingContract = useContract(kyberDaoInfo?.staking, StakingABI)
  const migrateContract = useContract(kyberDaoInfo?.KNCAddress, MigrateABI)

  const stake = useCallback(
    async (amount: BigNumber, votingPower: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.deposit(amount)
        const tx = await stakingContract.deposit(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_STAKE,
          extraInfo: {
            tokenSymbol: 'KNC',
            tokenAddress: kyberDaoInfo?.KNCAddress ?? '',
            tokenAmount: formatUnits(amount),
            arbitrary: { amount: formatUnits(amount), votingPower },
          },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract, kyberDaoInfo],
  )
  const unstake = useCallback(
    async (amount: BigNumber) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.withdraw(amount)
        const tx = await stakingContract.withdraw(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_UNSTAKE,
          extraInfo: {
            tokenSymbol: 'KNC',
            tokenAddress: kyberDaoInfo?.KNCAddress ?? '',
            tokenAmount: formatUnits(amount),
            arbitrary: { amount: formatUnits(amount) },
          },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract, kyberDaoInfo?.KNCAddress],
  )
  const migrate = useCallback(
    async (amount: BigNumber, rawAmount: string) => {
      if (!migrateContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await migrateContract.estimateGas.mintWithOldKnc(amount)
        const tx = await migrateContract.mintWithOldKnc(amount, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_MIGRATE,
          extraInfo: kyberDaoInfo
            ? {
                tokenAddressIn: kyberDaoInfo.KNCLAddress,
                tokenAddressOut: kyberDaoInfo.KNCAddress,
                tokenAmountIn: rawAmount,
                tokenAmountOut: rawAmount,
                tokenSymbolIn: 'KNCL',
                tokenSymbolOut: 'KNC',
              }
            : undefined,
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, migrateContract, kyberDaoInfo],
  )
  const delegate = useCallback(
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.delegate(address)
        const tx = await stakingContract.delegate(address, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_DELEGATE,
          extraInfo: { contract: address },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract],
  )
  const undelegate = useCallback(
    // address here alway should be user's address
    async (address: string) => {
      if (!stakingContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await stakingContract.estimateGas.delegate(address)
        const tx = await stakingContract.delegate(address, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_UNDELEGATE,
          extraInfo: { contract: address },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [addTransactionWithType, stakingContract],
  )

  return { stake, unstake, migrate, delegate, undelegate }
}

export function useClaimRewardActions() {
  const kyberDaoInfo = useKyberDAOInfo()
  const rewardDistributorContract = useContract(kyberDaoInfo?.rewardsDistributor, RewardDistributorABI)
  const addTransactionWithType = useTransactionAdder()

  const claim = useCallback(
    async ({
      cycle,
      index,
      address,
      tokens,
      cumulativeAmounts,
      merkleProof,
      formatAmount,
    }: {
      cycle: number
      index: number
      address: string
      tokens: string[]
      cumulativeAmounts: string[]
      merkleProof: string[]
      formatAmount: string
    }) => {
      if (!rewardDistributorContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const isValidClaim = await rewardDistributorContract.isValidClaim(
          cycle,
          index,
          address,
          tokens,
          cumulativeAmounts,
          merkleProof,
        )
        if (!isValidClaim) {
          throw new Error('Invalid claim')
        }
        const estimateGas = await rewardDistributorContract.estimateGas.claim(
          cycle,
          index,
          address,
          tokens,
          cumulativeAmounts,
          merkleProof,
        )
        const tx = await rewardDistributorContract.claim(
          cycle,
          index,
          address,
          tokens,
          cumulativeAmounts,
          merkleProof,
          {
            gasLimit: calculateGasMargin(estimateGas),
          },
        )
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_CLAIM,
          extraInfo: {
            contract: kyberDaoInfo?.rewardsDistributor,
            tokenAmount: formatAmount,
            tokenSymbol: 'KNC',
            tokenAddress: kyberDaoInfo?.KNCAddress,
          },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [rewardDistributorContract, addTransactionWithType, kyberDaoInfo],
  )
  return { claim }
}

export const useVotingActions = () => {
  const kyberDaoInfo = useKyberDAOInfo()
  const daoContract = useContract(kyberDaoInfo?.dao, DaoABI)
  const addTransactionWithType = useTransactionAdder()

  const vote = useCallback(
    async (campId: number, option: number) => {
      if (!daoContract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await daoContract.estimateGas.submitVote(campId, option)
        const tx = await daoContract.submitVote(campId, option, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.KYBERDAO_VOTE,
          extraInfo: { contract: kyberDaoInfo?.dao },
        })
        return tx.hash
      } catch (error) {
        if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected.')
        } else {
          throw error
        }
      }
    },
    [daoContract, addTransactionWithType, kyberDaoInfo?.dao],
  )
  return { vote }
}

const fetcher = (url: string) => {
  return fetch(url)
    .then(res => res.json())
    .then(res => res.data)
}

export function useStakingInfo() {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()
  const stakingContract = useContract(kyberDaoInfo?.staking, StakingABI)

  const stakedBalance = useSingleCallResult(stakingContract, 'getLatestStakeBalance', [account ?? undefined])
  const delegatedAddress = useSingleCallResult(stakingContract, 'getLatestRepresentative', [account ?? undefined])
  const KNCBalance = useTokenBalance(kyberDaoInfo?.KNCAddress || '')
  const isDelegated = useMemo(() => {
    return delegatedAddress.result?.[0] && delegatedAddress.result?.[0] !== account
  }, [delegatedAddress, account])

  const { data: stakerActions } = useSWR<StakerAction[]>(
    account && kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '/actions',
    fetcher,
  )

  return {
    stakedBalance: stakedBalance.result?.[0] || 0,
    KNCBalance: KNCBalance.value || 0,
    delegatedAddress: delegatedAddress.result?.[0],
    isDelegated,
    stakerActions,
  }
}

export function useVotingInfo() {
  const { account } = useActiveWeb3React()
  const kyberDaoInfo = useKyberDAOInfo()
  const rewardDistributorContract = useContract(kyberDaoInfo?.rewardsDistributor, RewardDistributorABI)
  const { data: daoInfo } = useSWR(kyberDaoInfo?.daoStatsApi + '/dao-info', fetcher)
  const [localStoredDaoInfo, setLocalStoredDaoInfo] = useLocalStorage('kyberdao-daoInfo')
  useEffect(() => {
    if (daoInfo) {
      setLocalStoredDaoInfo(daoInfo)
    }
  }, [daoInfo, setLocalStoredDaoInfo])
  const merkleData = useSingleCallResult(rewardDistributorContract, 'getMerkleData')

  const merkleDataFileUrl = useMemo(() => {
    if (!merkleData) return
    const merkleDataRes = merkleData.result?.[0]
    const cycle = parseInt(merkleDataRes?.[0]?.toString())
    const merkleDataFileUrl = merkleDataRes?.[2]
    if (!cycle || !merkleDataFileUrl) {
      return
    }
    return merkleDataFileUrl
  }, [merkleData])

  const { data: userRewards } = useSWRImmutable(
    account && merkleDataFileUrl ? [merkleDataFileUrl, account] : null,
    (url: string, address: string) => {
      return fetch(url)
        .then(res => res.json())
        .then(res => {
          res.userReward = address ? res.userRewards[address] : undefined
          delete res.userRewards
          return res
        })
    },
  )

  const claimedRewardAmounts = useSingleCallResult(rewardDistributorContract, 'getClaimedAmounts', [
    account,
    userRewards?.userReward?.tokens,
  ])

  const remainingCumulativeAmount: BigNumber = useMemo(() => {
    if (!userRewards?.userReward?.tokens || !claimedRewardAmounts?.result) return BigNumber.from(0)
    return (
      userRewards?.userReward?.tokens?.map((_: string, index: number) => {
        const cummulativeAmount =
          userRewards.userReward &&
          userRewards.userReward.cumulativeAmounts &&
          userRewards.userReward.cumulativeAmounts[index]

        if (!cummulativeAmount) {
          return BigNumber.from(0)
        }
        const claimedAmount = claimedRewardAmounts?.result?.[0]?.[index] || 0

        return BigNumber.from(cummulativeAmount).sub(BigNumber.from(claimedAmount))
      })[0] || BigNumber.from(0)
    )
  }, [claimedRewardAmounts, userRewards?.userReward])

  const { data: proposals } = useSWR<ProposalDetail[]>(
    kyberDaoInfo?.daoStatsApi + '/proposals',
    (url: string) =>
      fetch(url)
        .then(res => res.json())
        .then(res =>
          res.data.map((p: ProposalDetail) => {
            let mappedStatus
            switch (p.status) {
              case 'Succeeded':
              case 'Queued':
              case 'Finalized':
                mappedStatus = ProposalStatus.Approved
                break
              case 'Expired':
                mappedStatus = ProposalStatus.Failed
                break
              default:
                mappedStatus = p.status
                break
            }
            return { ...p, status: mappedStatus }
          }),
        ),
    {
      refreshInterval: 15000,
    },
  )

  const { data: stakerInfo } = useSWR<StakerInfo>(
    daoInfo?.current_epoch &&
      account &&
      kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '?epoch=' + daoInfo?.current_epoch,
    fetcher,
  )
  const { data: stakerInfoNextEpoch } = useSWR<StakerInfo>(
    daoInfo?.current_epoch &&
      account &&
      kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '?epoch=' + (parseFloat(daoInfo?.current_epoch) + 1),
    fetcher,
  )

  const calculateVotingPower = useCallback(
    (kncAmount: string, newStakingAmount?: string) => {
      if (!daoInfo?.total_staked) return '0'
      const totalStakedKNC = daoInfo?.total_staked
      if (parseFloat(totalStakedKNC) === 0) return '0'

      const votingPower =
        newStakingAmount && parseFloat(newStakingAmount) > 0
          ? ((parseFloat(kncAmount) + parseFloat(newStakingAmount)) / (totalStakedKNC + parseFloat(newStakingAmount))) *
            100
          : (parseFloat(kncAmount) / totalStakedKNC) * 100
      if (votingPower <= 0) return '0'
      if (votingPower < 0.000001) {
        return '0.000001'
      } else {
        return parseFloat(votingPower.toPrecision(3)).toString()
      }
    },
    [daoInfo],
  )

  const { data: votesInfo } = useSWR<VoteInfo[]>(
    account ? kyberDaoInfo?.daoStatsApi + '/stakers/' + account + '/votes' : null,
    fetcher,
  )

  return {
    daoInfo: daoInfo || localStoredDaoInfo || undefined,
    userRewards,
    calculateVotingPower,
    proposals,
    userReward: userRewards?.userReward,
    remainingCumulativeAmount,
    stakerInfo,
    stakerInfoNextEpoch,
    votesInfo,
  }
}

export function useProposalInfoById(id?: number): { proposalInfo?: ProposalDetail } {
  const kyberDaoInfo = useKyberDAOInfo()
  const { data } = useSWRImmutable(
    id !== undefined ? kyberDaoInfo?.daoStatsApi + '/proposals/' + id : undefined,
    fetcher,
    { refreshInterval: 15000 },
  )
  return { proposalInfo: data }
}
