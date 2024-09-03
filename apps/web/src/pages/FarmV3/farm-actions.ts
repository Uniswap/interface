import { defaultAbiCoder } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { useUbeswapV3FarmingContract, useV3NFTPositionManagerContract } from 'hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useV3IncentiveFullData, type IncentiveDataItem } from 'pages/Earn/data/useFarms'
import { type IncentiveKey } from 'pages/Earn/data/v3-incentive-list'
import { useCallback, useMemo, useState } from 'react'
import { usePendingTransactions, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { calculateGasMargin } from 'utils/calculateGasMargin'

const FARM_ADDRESS = '0xA6E9069CB055a425Eb41D185b740B22Ec8f51853'

function encodeKeys(keys: IncentiveKey[]) {
  const keyArrayType =
    'tuple(address rewardToken,address pool, uint32 startTime, uint32 lockTime, int24 minimumTickRange, int24 maxTickLower, int24 minTickLower, int24 maxTickUpper, int24 minTickUpper)[]'
  return defaultAbiCoder.encode([keyArrayType], [keys])
}

export function useDepositCallback(): [
  (tokenId: BigNumber, incentives: IncentiveKey[]) => Promise<void>,
  string,
  boolean
] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const nftContract = useV3NFTPositionManagerContract(true)

  const cb = useCallback(
    async (tokenId: BigNumber, incentives: IncentiveKey[]): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }

      if (!nftContract || !nftContract.signer) {
        console.error('contract or signer is null')
        return
      }

      if (tokenId.eq(0)) {
        console.error('tokenId is zero')
        return
      }

      try {
        console.log('##SET## ispending')
        setIsPending(true)

        const data = encodeKeys(incentives)

        const convertArgs = [account, FARM_ADDRESS, tokenId.toString(), data] as const
        const functionName = 'safeTransferFrom(address,address,uint256,bytes)' as const
        await nftContract.estimateGas[functionName](...convertArgs)
          .then((estimatedGasLimit) => {
            return nftContract[functionName](...convertArgs, {
              gasLimit: calculateGasMargin(estimatedGasLimit),
            }).then((response: TransactionResponse) => {
              setTxHash(response.hash)
              addTransaction(response, {
                type: TransactionType.CUSTOM,
                summary: 'Depositing to V3 Farm',
              })
              return response.wait(2)
            })
          })
          .catch((error) => {
            console.error('Failed to send transaction', error)
            console.log('##SET## ispending false')
            setIsPending(false)
            setTxHash('')
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      } catch (e) {
        console.error(e)
      } finally {
        console.log('##SET## ispending false 2')
        setIsPending(false)
        setTxHash('')
      }
    },
    [isPending, nftContract, account, pendingTxs, addTransaction]
  )

  return [cb, txHash, isPending]
}

export function useWithdrawCallback(): [
  (tokenId: BigNumber, incentives: IncentiveKey[], collectParams: CollectRewardParams[]) => Promise<void>,
  string,
  boolean
] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const farmContract = useUbeswapV3FarmingContract(FARM_ADDRESS)

  const cb = useCallback(
    async (tokenId: BigNumber, incentives: IncentiveKey[], collectParams: CollectRewardParams[]): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }

      if (!farmContract || !farmContract.signer) {
        console.error('contract or signer is null')
        return
      }

      if (tokenId.eq(0)) {
        console.error('tokenId is zero')
        return
      }

      try {
        console.log('##SET## ispending 3')
        setIsPending(true)

        const calldatas: string[] = [
          ...collectParams.map((collectParam) =>
            farmContract.interface.encodeFunctionData('collectReward', [
              collectParam.key,
              collectParam.tokenId,
              collectParam.accumulatedRewards,
              collectParam.proof,
            ])
          ),
          ...incentives.map((incentive) =>
            farmContract.interface.encodeFunctionData('unstakeToken', [incentive, tokenId])
          ),
          farmContract.interface.encodeFunctionData('withdrawToken', [tokenId, account, '0x']),
        ]
        await farmContract.estimateGas
          .multicall(calldatas)
          .then((estimatedGasLimit) => {
            return farmContract
              .multicall(calldatas, {
                gasLimit: calculateGasMargin(estimatedGasLimit),
              })
              .then((response: TransactionResponse) => {
                setTxHash(response.hash)
                addTransaction(response, {
                  type: TransactionType.CUSTOM,
                  summary: 'Withdraw from V3 Farm',
                })
                return response.wait(2)
              })
          })
          .catch((error) => {
            console.error('Failed to send transaction', error)
            console.log('##SET## ispending 4')
            setIsPending(false)
            setTxHash('')
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      } catch (e) {
        console.error(e)
      } finally {
        console.log('##SET## ispending 5')
        setIsPending(false)
        setTxHash('')
      }
    },
    [isPending, farmContract, account, pendingTxs, addTransaction]
  )

  return [cb, txHash, isPending]
}

interface CollectRewardParams {
  key: IncentiveKey
  tokenId: BigNumber
  accumulatedRewards: BigNumber
  proof: string[]
}
export function useCollectRewardCallback(): [(collectParams: CollectRewardParams[]) => Promise<void>, string, boolean] {
  const { account } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const pendingTxs = usePendingTransactions()
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const farmContract = useUbeswapV3FarmingContract(FARM_ADDRESS)

  const cb = useCallback(
    async (collectParams: CollectRewardParams[]): Promise<void> => {
      if (!account) {
        console.error('no account')
        return
      }
      if (pendingTxs.length > 0) {
        console.error('already pending transaction')
        return
      }
      if (isPending) {
        console.error('already pending')
        return
      }

      if (!farmContract || !farmContract.signer) {
        console.error('contract or signer is null')
        return
      }

      if (collectParams.length === 0) {
        console.error('collectParams is empty')
        return
      }

      try {
        console.log('##SET## ispending 5')
        setIsPending(true)

        const calldatas: string[] = [
          ...collectParams.map((collectParam) =>
            farmContract.interface.encodeFunctionData('collectReward', [
              collectParam.key,
              collectParam.tokenId,
              collectParam.accumulatedRewards,
              collectParam.proof,
            ])
          ),
        ]
        await farmContract.estimateGas
          .multicall(calldatas)
          .then((estimatedGasLimit) => {
            return farmContract
              .multicall(calldatas, {
                gasLimit: calculateGasMargin(estimatedGasLimit),
              })
              .then((response: TransactionResponse) => {
                setTxHash(response.hash)
                addTransaction(response, {
                  type: TransactionType.CUSTOM,
                  summary: 'Collecting Rewards',
                })
                return response.wait(2)
              })
          })
          .catch((error) => {
            console.error('Failed to send transaction', error)
            console.log('##SET## ispending 6')
            setIsPending(false)
            setTxHash('')
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      } catch (e) {
        console.error(e)
      } finally {
        console.log('##SET## ispending 7')
        setIsPending(false)
        setTxHash('')
      }
    },
    [isPending, farmContract, account, pendingTxs, addTransaction]
  )

  return [cb, txHash, isPending]
}

interface IncentiveContractInfo {
  currentPeriodId: number
  lastUpdateTime: number
  endTime: number
  numberOfStakes: number
  distributedRewards: BigNumber
  merkleRoot: string
  ipfsHash: string
  excessRewards: BigNumber
  externalRewards: BigNumber
}

export function useIncentiveContractInfo(incentiveId: string): IncentiveContractInfo | undefined {
  const farmContract = useUbeswapV3FarmingContract(FARM_ADDRESS)
  const result = useSingleCallResult(farmContract, 'incentives', [incentiveId], NEVER_RELOAD)
  return (result?.result as unknown as IncentiveContractInfo) || undefined
}

interface TokenData {
  tokenId: BigNumber
  incentiveData: IncentiveDataItem | undefined
  stakeInfo:
    | {
        claimedReward: BigNumber
        stakeTime: number
        initialSecondsInside: number
      }
    | undefined
}
export function useIncentiveTokenData(incentiveId: string, tokenIds: BigNumber[]) {
  const farmContract = useUbeswapV3FarmingContract(FARM_ADDRESS)
  const inputs = useMemo(
    () => (tokenIds && incentiveId ? tokenIds.map((tokenId) => [incentiveId, BigNumber.from(tokenId)]) : []),
    [tokenIds, incentiveId]
  )
  const stakeInfos = useSingleContractMultipleData(farmContract, 'stakes', inputs)
  const fullData = useV3IncentiveFullData(incentiveId)

  return useMemo(() => {
    const result: TokenData[] = []
    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i]
      const incentiveData = fullData ? fullData.find((d) => tokenId.eq(d.tokenId)) : undefined
      let stakeInfo
      if (stakeInfos.length === tokenIds.length && stakeInfos[i].result && stakeInfos[i].error === false) {
        stakeInfo = {
          claimedReward: stakeInfos[i]!.result!.claimedReward,
          stakeTime: stakeInfos[i]!.result!.stakeTime,
          initialSecondsInside: stakeInfos[i]!.result!.initialSecondsInside,
        }
      }
      result.push({
        tokenId,
        incentiveData,
        stakeInfo,
      })
    }

    return result
  }, [tokenIds, fullData, stakeInfos])
}
