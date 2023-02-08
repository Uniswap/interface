import { defaultAbiCoder } from '@ethersproject/abi'
import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useMemo, useState } from 'react'

import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { useActiveWeb3React } from 'hooks'
import { useTokens } from 'hooks/Tokens'
import { useProAmmNFTPositionManagerContract, useProMMFarmContract } from 'hooks/useContract'
import { usePools } from 'hooks/usePools'
import { FarmingPool, NFTPosition } from 'state/farms/elastic/types'
import { useAppSelector } from 'state/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import {
  TRANSACTION_TYPE,
  TransactionExtraInfoHarvestFarm,
  TransactionExtraInfoStakeFarm,
} from 'state/transactions/type'
import { PositionDetails } from 'types/position'
import { calculateGasMargin } from 'utils'

import { defaultChainData } from '.'

export { default as FarmUpdater } from './updaters'

export const useElasticFarms = () => {
  const { chainId, isEVM } = useActiveWeb3React()
  const elasticFarm = useAppSelector(state => state.elasticFarm[chainId])
  return useMemo(() => (isEVM ? elasticFarm || defaultChainData : defaultChainData), [isEVM, elasticFarm])
}
export type StakeParam = {
  nftId: BigNumber
  position: NFTPosition | Position
  stakedLiquidity: string
  poolAddress: string
}

const getTransactionExtraInfo = (
  positions: Position[] | NFTPosition[],
  poolIds: string[],
  nftIds: string[],
): TransactionExtraInfoStakeFarm => {
  if (!positions[0]?.amount0) {
    return { pairs: [] }
  }
  const pairs = positions.map((item, index) => {
    const { amount0, amount1 } = item
    return {
      tokenAddressIn: amount0.currency.address,
      tokenAddressOut: amount1.currency.address,
      tokenSymbolIn: amount0.currency.symbol ?? '',
      tokenSymbolOut: amount1.currency.symbol ?? '',
      tokenAmountIn: amount0.toSignificant(6),
      tokenAmountOut: amount1.toSignificant(6),
      poolAddress: poolIds[index],
      nftId: nftIds[index],
    }
  })
  return { pairs }
}

export const useFarmAction = (address: string) => {
  const addTransactionWithType = useTransactionAdder()
  const contract = useProMMFarmContract(address)
  const posManager = useProAmmNFTPositionManagerContract()

  const approve = useCallback(async () => {
    if (!posManager) {
      throw new Error(CONTRACT_NOT_FOUND_MSG)
    }
    const estimateGas = await posManager.estimateGas.setApprovalForAll(address, true)
    const tx = await posManager.setApprovalForAll(address, true, {
      gasLimit: calculateGasMargin(estimateGas),
    })
    addTransactionWithType({
      hash: tx.hash,
      type: TRANSACTION_TYPE.APPROVE,
      extraInfo: {
        summary: `Elastic Farm`,
        contract: address,
      },
    })

    return tx.hash
  }, [addTransactionWithType, address, posManager])

  // Deposit
  const deposit = useCallback(
    async (positionDetails: PositionDetails[], positions: Position[]) => {
      const nftIds = positionDetails.map(e => e.tokenId)
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.deposit(nftIds)
      const tx = await contract.deposit(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_DEPOSIT_LIQUIDITY,
        extraInfo: getTransactionExtraInfo(
          positions,
          positionDetails.map(e => e.poolId),
          positionDetails.map(e => e.tokenId.toString()),
        ),
      })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const withdraw = useCallback(
    async (positionDetails: PositionDetails[], positions: Position[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const nftIds = positionDetails.map(e => e.tokenId)
      const estimateGas = await contract.estimateGas.withdraw(nftIds)
      const tx = await contract.withdraw(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_WITHDRAW_LIQUIDITY,
        extraInfo: getTransactionExtraInfo(
          positions,
          positionDetails.map(e => e.poolId),
          positionDetails.map(e => e.tokenId.toString()),
        ),
      })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const emergencyWithdraw = useCallback(
    async (nftIds: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      const estimateGas = await contract.estimateGas.emergencyWithdraw(nftIds)
      const tx = await contract.emergencyWithdraw(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.ELASTIC_FORCE_WITHDRAW_LIQUIDITY,
        extraInfo: { contract: address },
      })

      return tx.hash
    },
    [addTransactionWithType, contract, address],
  )

  const stake = useCallback(
    async (pid: BigNumber, selectedNFTs: StakeParam[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const nftIds = selectedNFTs.map(item => item.nftId)
      const liqs = selectedNFTs.map(item => BigNumber.from(item.position.liquidity.toString()))

      const estimateGas = await contract.estimateGas.join(pid, nftIds, liqs)
      const tx = await contract.join(pid, nftIds, liqs, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.STAKE,
        extraInfo: getTransactionExtraInfo(
          selectedNFTs.map(e => e.position),
          selectedNFTs.map(e => e.poolAddress),
          nftIds.map(e => e.toString()),
        ),
      })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const unstake = useCallback(
    async (pid: BigNumber, selectedNFTs: StakeParam[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const nftIds = selectedNFTs.map(item => item.nftId)
        const liqs = selectedNFTs.map(item => BigNumber.from(item.stakedLiquidity))
        const estimateGas = await contract.estimateGas.exit(pid, nftIds, liqs)
        const tx = await contract.exit(pid, nftIds, liqs, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType({
          hash: tx.hash,
          type: TRANSACTION_TYPE.UNSTAKE,
          extraInfo: getTransactionExtraInfo(
            selectedNFTs.map(e => e.position),
            selectedNFTs.map(e => e.poolAddress),
            nftIds.map(e => e.toString()),
          ),
        })

        return tx.hash
      } catch (e) {
        console.log(e)
      }
    },
    [addTransactionWithType, contract],
  )

  const harvest = useCallback(
    async (
      nftIds: BigNumber[],
      poolIds: BigNumber[],
      farm: FarmingPool | undefined,
      farmRewards: CurrencyAmount<Currency>[],
    ) => {
      if (!contract) return

      const encodeData = poolIds.map(id => defaultAbiCoder.encode(['tupple(uint256[] pIds)'], [{ pIds: [id] }]))

      try {
        const estimateGas = await contract.estimateGas.harvestMultiplePools(nftIds, encodeData)
        const tx = await contract.harvestMultiplePools(nftIds, encodeData, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        const extraInfo: TransactionExtraInfoHarvestFarm = {
          tokenAddressIn: farm?.token0?.wrapped.address,
          tokenAddressOut: farm?.token1?.wrapped.address,
          tokenSymbolIn: farm?.token0?.symbol,
          tokenSymbolOut: farm?.token1?.symbol,
          contract: farm?.id,
          rewards:
            farmRewards?.map(reward => ({
              tokenSymbol: reward.currency.symbol ?? '',
              tokenAmount: reward.toSignificant(6),
              tokenAddress: reward.currency.wrapped.address,
            })) ?? [],
        }
        addTransactionWithType({ hash: tx.hash, type: TRANSACTION_TYPE.HARVEST, extraInfo })
        return tx
      } catch (e) {
        console.log(e)
      }
    },
    [addTransactionWithType, contract],
  )

  return { deposit, withdraw, approve, stake, unstake, harvest, emergencyWithdraw }
}

const filterOptions = [
  {
    code: 'in_rage',
    value: t`In range`,
  },
  {
    code: 'out_range',
    value: t`Out of range`,
  },
  {
    code: 'all',
    value: t`All positions`,
  },
] as const
export const usePositionFilter = (positions: PositionDetails[], validPools: string[]) => {
  const [activeFilter, setActiveFilter] = useState<typeof filterOptions[number]['code']>('all')

  const tokenList = useMemo(() => {
    if (!positions) return []
    return positions?.map(pos => [pos.token0, pos.token1]).flat()
  }, [positions])

  const tokens = useTokens(tokenList)

  const poolKeys = useMemo(() => {
    if (!tokens) return []
    return positions?.map(
      pos =>
        [tokens[pos.token0], tokens[pos.token1], pos.fee] as [
          Token | undefined,
          Token | undefined,
          FeeAmount | undefined,
        ],
    )
  }, [tokens, positions])

  const pools = usePools(poolKeys)

  const eligiblePositions = useMemo(() => {
    return positions
      ?.filter(pos => validPools?.includes(pos.poolId.toLowerCase()))
      .filter(pos => {
        // remove closed position
        if (pos.liquidity.eq(0)) return false

        const pool = pools.find(
          p =>
            p[1]?.token0.address.toLowerCase() === pos.token0.toLowerCase() &&
            p[1]?.token1.address.toLowerCase() === pos.token1.toLowerCase() &&
            p[1]?.fee === pos.fee,
        )

        if (activeFilter === 'out_range') {
          if (pool && pool[1]) {
            return pool[1].tickCurrent < pos.tickLower || pool[1].tickCurrent > pos.tickUpper
          }
          return true
        } else if (activeFilter === 'in_rage') {
          if (pool && pool[1]) {
            return pool[1].tickCurrent >= pos.tickLower && pool[1].tickCurrent <= pos.tickUpper
          }
          return true
        }
        return true
      })
  }, [positions, validPools, activeFilter, pools])

  return {
    activeFilter,
    setActiveFilter,
    eligiblePositions,
    filterOptions,
  }
}

export const useFailedNFTs = () => {
  const { chainId } = useActiveWeb3React()

  const elasticFarm = useAppSelector(state => state.elasticFarm)
  return useMemo(() => {
    if (chainId) return elasticFarm[chainId]?.failedNFTs || []
    return []
  }, [elasticFarm, chainId])
}
