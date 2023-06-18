import { Interface } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import type { TransactionResponse } from '@ethersproject/providers'
import { parseBytes32String } from '@ethersproject/strings'
import { useWeb3React } from '@web3-react/core'
import POOL_EXTENDED_ABI from 'abis/pool-extended.json'
import RB_POOL_FACTORY_ABI from 'abis/rb-pool-factory.json'
import RB_REGISTRY_ABI from 'abis/rb-registry.json'
import { RB_FACTORY_ADDRESSES, RB_REGISTRY_ADDRESSES } from 'constants/addresses'
import { POOLS_LIST } from 'constants/lists'
import { GRG } from 'constants/tokens'
import { useContract } from 'hooks/useContract'
import { useTotalSupply } from 'hooks/useTotalSupply'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useStakingContract } from 'state/governance/hooks'
import { useAppSelector } from 'state/hooks'
import { useBscPoolsList } from 'state/lists/poolsList/hooks'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { SupportedChainId } from '../../constants/chains'
import { CallStateResult, useSingleContractMultipleData } from '../../lib/hooks/multicall'
import { useLogs } from '../logs/hooks'
import { filterToKey } from '../logs/utils'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionType } from '../transactions/types'

//const PoolInterface = new Interface(POOL_EXTENDED_ABI)
const RegistryInterface = new Interface(RB_REGISTRY_ABI)

export function useRegistryContract(): Contract | null {
  return useContract(RB_REGISTRY_ADDRESSES, RB_REGISTRY_ABI, true)
}

function usePoolFactoryContract(): Contract | null {
  return useContract(RB_FACTORY_ADDRESSES, RB_POOL_FACTORY_ABI, true)
}

export function usePoolExtendedContract(poolAddress: string | undefined): Contract | null {
  return useContract(poolAddress, POOL_EXTENDED_ABI, true)
}

export interface PoolRegisteredLog {
  group?: string
  pool: string
  name: string
  symbol: string
  id: string
}

function useStartBlock(chainId: number | undefined): number | undefined {
  let registryStartBlock
  const blockNumber = useBlockNumber()

  if (chainId === SupportedChainId.MAINNET) {
    registryStartBlock = 15834693
  } else if (chainId === SupportedChainId.GOERLI) {
    registryStartBlock = 7807806
  } else if (chainId === SupportedChainId.ARBITRUM_ONE) {
    registryStartBlock = 35439804
  } else if (chainId === SupportedChainId.OPTIMISM) {
    registryStartBlock = 34629059
  } else if (chainId === SupportedChainId.POLYGON) {
    registryStartBlock = 35228892
  } else if (chainId === SupportedChainId.BNB) {
    registryStartBlock = typeof blockNumber === 'number' ? blockNumber - 40000 : blockNumber //28843676
  } else {
    registryStartBlock = undefined
  }

  return registryStartBlock
}

/**
 * Need pool events to get list of pools by owner.
 */
function useFormattedPoolCreatedLogs(
  contract: Contract | null,
  account: string | undefined,
  fromBlock: number
): PoolRegisteredLog[] | undefined {
  // create filters for Registered events
  const filter = useMemo(() => {
    const logFilter = contract?.filters?.Registered()
    // we do not poll events until account is connected
    if (!account || !logFilter) return undefined
    return {
      ...logFilter,
      fromBlock,
    }
  }, [account, contract, fromBlock])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs
      ?.map((log) => {
        const parsed = RegistryInterface.parseLog(log).args
        return parsed
      })
      ?.map((parsed) => {
        const group = parsed.group
        const pool = parsed.pool
        const name = parseBytes32String(parsed.name)
        const symbol = parseBytes32String(parsed.symbol)
        const id = parsed.id //.toString()

        return { group, pool, name, symbol, id }
      })
      .reverse()
  }, [useLogsResult])
}

export function useAllPoolsData(): { data?: PoolRegisteredLog[]; loading: boolean } {
  const { account, chainId } = useWeb3React()
  const registry = useRegistryContract()
  const blockNumber = useBlockNumber()

  // get metadata from past events
  let registryStartBlock

  if (chainId === SupportedChainId.MAINNET) {
    registryStartBlock = 15834693
  } else if (chainId === SupportedChainId.GOERLI) {
    registryStartBlock = 7807806
  } else if (chainId === SupportedChainId.ARBITRUM_ONE) {
    registryStartBlock = 35439804
  } else if (chainId === SupportedChainId.OPTIMISM) {
    registryStartBlock = 34629059
  } else if (chainId === SupportedChainId.POLYGON) {
    registryStartBlock = 35228892
  } else if (chainId === SupportedChainId.BNB) {
    registryStartBlock = typeof blockNumber === 'number' ? blockNumber - 40000 : 28843676
  } else {
    registryStartBlock = 1
  }

  // we want to be able to filter by account
  const formattedLogsV1: PoolRegisteredLog[] | undefined = useFormattedPoolCreatedLogs(
    registry,
    account,
    registryStartBlock
  )

  const bscPools = useBscPools(registry)

  // early return until events are fetched
  return useMemo(() => {
    //const formattedLogs = [...(formattedLogsV1 ?? [])]

    // prevent display if wallet not connected
    if (!account) {
      return { loading: false }
    }

    // TODO: we might have temporary duplicate non-identical pools as group is empty in pools from endpoint
    if (chainId === SupportedChainId.BNB && registry) {
      // eslint-disable-next-line
      const pools: PoolRegisteredLog[] = ([...(formattedLogsV1 ?? []), ...(bscPools ?? [])])
      return { data: pools, loading: false }
    }

    if (registry && !formattedLogsV1) {
      return { data: [], loading: true }
    }

    return { data: formattedLogsV1, loading: false }
  }, [account, chainId, formattedLogsV1, registry, bscPools])
}

// Bsc endpoints have eth_getLogs limit, so we query pools before recent history from pools list endpoint
export function useBscPools(regitry: Contract | null): PoolRegisteredLog[] | undefined {
  const bscPools = useBscPoolsList(POOLS_LIST)
  const poolAddresses = useMemo(() => (bscPools ? bscPools.map((p) => [p.address]) : []), [bscPools])
  const result = useSingleContractMultipleData(regitry, 'getPoolIdFromAddress', poolAddresses)
  const poolsLoading = useMemo(() => result.some(({ loading }) => loading), [result])
  const poolsError = useMemo(() => result.some(({ error }) => error), [result])
  return useMemo(() => {
    if (poolsLoading || poolsError) return undefined
    const poolIds = result.map((call) => {
      const result = call.result as CallStateResult
      return result[0]
    })
    return bscPools?.map((p, i) => {
      const pool = p.address
      const name = p.name
      const symbol = p.symbol
      const id = poolIds[i]

      return { pool, name, symbol, id }
    })
  }, [bscPools, poolsLoading, poolsError, result])
}

export function useCreateCallback(): (
  name: string | undefined,
  symbol: string | undefined,
  baseCurrency: string | undefined
) => undefined | Promise<string> {
  const { account, chainId, provider } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const factoryContract = usePoolFactoryContract()

  return useCallback(
    (name: string | undefined, symbol: string | undefined, baseCurrency: string | undefined) => {
      // TODO: check name and symbol assertions
      //if (!provider || !chainId || !account || name === '' || symbol === '' || !isAddress(baseCurrency ?? ''))
      if (!provider || !chainId || !account || !name || !symbol || !isAddress(baseCurrency ?? '')) return undefined
      if (!factoryContract) throw new Error('No Factory Contract!')
      // TODO: check correctness of asserting is address before returning on no address
      if (!baseCurrency) return
      return factoryContract.estimateGas.createPool(name, symbol, baseCurrency, {}).then((estimatedGasLimit) => {
        return factoryContract
          .createPool(name, symbol, baseCurrency, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              // TODO: define correct transaction type
              type: TransactionType.DELEGATE,
              delegatee: baseCurrency,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, provider, factoryContract]
  )
}

export function useRegisteredPools(): PoolRegisteredLog[] | undefined {
  const { chainId } = useWeb3React()
  const registry = useRegistryContract()
  const fromBlock = useStartBlock(chainId)
  // create filters for Registered events
  const filter = useMemo(() => {
    const filter = registry?.filters?.Registered()
    if (!filter) return undefined
    return {
      ...filter,
      fromBlock,
    }
  }, [registry, fromBlock])
  const logs = useAppSelector((state) => state.logs)
  if (!chainId || !filter) return []
  const state = logs[chainId]?.[filterToKey(filter)]
  const result = state?.results

  return result?.logs
    ?.map((log) => {
      const parsed = RegistryInterface.parseLog(log).args
      return parsed
    })
    ?.map((parsed) => {
      const group = parsed.group
      const pool = parsed.pool
      const name = parseBytes32String(parsed.name)
      const symbol = parseBytes32String(parsed.symbol)
      const id = parsed.id //.toString()
      const poolData: PoolRegisteredLog = { group, pool, name, symbol, id }

      return poolData
    })
    .reverse()
}

export function useSetLockupCallback(): (lockup: string | undefined) => undefined | Promise<string> {
  const { account, chainId, provider } = useWeb3React()
  const { poolAddress: poolAddressFromUrl } = useParams<{ poolAddress?: string }>()
  const poolContract = usePoolExtendedContract(poolAddressFromUrl ?? undefined)

  return useCallback(
    (lockup: string | undefined) => {
      if (!provider || !chainId || !account) return undefined
      if (!poolContract) throw new Error('No Pool Contract!')
      return poolContract.estimateGas.changeMinPeriod(lockup, {}).then((estimatedGasLimit) => {
        return poolContract.changeMinPeriod(lockup, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
      })
    },
    [account, chainId, provider, poolContract]
  )
}

export function useSetSpreadCallback(): (spread: string | undefined) => undefined | Promise<string> {
  const { account, chainId, provider } = useWeb3React()
  const { poolAddress: poolAddressFromUrl } = useParams<{ poolAddress?: string }>()
  const poolContract = usePoolExtendedContract(poolAddressFromUrl ?? undefined)

  return useCallback(
    (spread: string | undefined) => {
      if (!provider || !chainId || !account) return undefined
      if (!poolContract) throw new Error('No Pool Contract!')
      return poolContract.estimateGas.changeSpread(spread, {}).then((estimatedGasLimit) => {
        return poolContract.changeSpread(spread, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
      })
    },
    [account, chainId, provider, poolContract]
  )
}

export function useSetValueCallback(): (value: string | undefined) => undefined | Promise<string> {
  const { account, chainId, provider } = useWeb3React()
  const { poolAddress: poolAddressFromUrl } = useParams<{ poolAddress?: string }>()
  const poolContract = usePoolExtendedContract(poolAddressFromUrl ?? undefined)

  return useCallback(
    (value: string | undefined) => {
      if (!provider || !chainId || !account) return undefined
      if (!poolContract) throw new Error('No Pool Contract!')
      return poolContract.estimateGas.setUnitaryValue(value, {}).then((estimatedGasLimit) => {
        return poolContract.setUnitaryValue(value, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
      })
    },
    [account, chainId, provider, poolContract]
  )
}

interface StakingPools {
  id: string
  operatorShare: number
  apr: number
  delegatedStake: BigNumber
  poolOwnStake: BigNumber
}

interface UseStakingPools {
  loading: boolean
  stakingPools?: StakingPools[]
}

export function useStakingPools(addresses: string[] | undefined, poolIds: string[] | undefined): UseStakingPools {
  const stakingContract = useStakingContract()

  const inputs = useMemo(() => (poolIds ? poolIds.map((poolId) => [poolId]) : []), [poolIds])
  const poolAddresses = useMemo(() => (addresses ? addresses.map((address) => [address, 1]) : []), [addresses])

  const poolsData = useSingleContractMultipleData(stakingContract, 'getStakingPool', inputs)
  const poolsStakes = useSingleContractMultipleData(stakingContract, 'getTotalStakeDelegatedToPool', inputs)
  // TODO: if we allow pools to stake pools other then self we'll have to use getStakeDelegateToPoolByOwner
  const poolsOwnStakes = useSingleContractMultipleData(stakingContract, 'getOwnerStakeByStatus', poolAddresses)

  const poolsLoading = useMemo(() => poolsData.some(({ loading }) => loading), [poolsData])
  const stakesLoading = useMemo(() => poolsStakes.some(({ loading }) => loading), [poolsStakes])
  const ownStakesLoading = useMemo(() => poolsOwnStakes.some(({ loading }) => loading), [poolsOwnStakes])
  const poolsError = useMemo(() => poolsData.some(({ error }) => error), [poolsData])
  const stakesError = useMemo(() => poolsStakes.some(({ error }) => error), [poolsStakes])
  const ownStakesError = useMemo(() => poolsOwnStakes.some(({ error }) => error), [poolsOwnStakes])

  const stakingPools = useMemo(() => {
    if (!poolsLoading && !poolsError && poolIds) {
      return poolsData.map((call, i) => {
        const id = poolIds[i]
        const result = call.result as CallStateResult
        return {
          id,
          operatorShare: result[0].operatorShare,
        }
      })
    }
    return undefined
  }, [poolsError, poolsLoading, poolIds, poolsData])

  const delegatedStakes = useMemo(() => {
    if (!stakesLoading && !stakesError && addresses && poolIds) {
      return poolsStakes.map((call, i) => {
        const id = poolIds[i]
        const result = call.result as CallStateResult
        return {
          id,
          delegatedStake: result[0].nextEpochBalance,
        }
      })
    }
    return undefined
  }, [stakesLoading, stakesError, addresses, poolIds, poolsStakes])

  const delegatedOwnStakes = useMemo(() => {
    if (!ownStakesLoading && !ownStakesError && addresses && poolIds) {
      return poolsOwnStakes.map((call, i) => {
        const id = poolIds[i]
        const result = call.result as CallStateResult
        return {
          id,
          poolOwnStake: result[0].nextEpochBalance,
        }
      })
    }
    return undefined
  }, [ownStakesLoading, ownStakesError, addresses, poolIds, poolsOwnStakes])

  const totalDelegatedStake = delegatedStakes?.reduce((prev, curr) => prev + Number(curr.delegatedStake), 0)
  const totalPoolsOwnStake = delegatedOwnStakes?.reduce((prev, curr) => prev + Number(curr.poolOwnStake), 0)
  // TODO: check if should pass supply from parent
  const { chainId } = useWeb3React()
  const supplyAmount = useTotalSupply(GRG[chainId ?? 1])

  const aprs = useMemo(() => {
    if (!delegatedStakes || !delegatedOwnStakes || !totalDelegatedStake || !totalPoolsOwnStake || !supplyAmount)
      return undefined
    const poolsInfo = stakingPools?.map((pool, i) => ({
      ...pool,
      operatorShare: stakingPools[i].operatorShare,
      delegatedStake: delegatedStakes[i].delegatedStake,
      delegatedOwnStake: delegatedOwnStakes[i].poolOwnStake,
    }))

    return poolsInfo?.map((p) => {
      // if we want to return NaN when pool has no delegated stake, we can remove the following assertion
      const apr =
        p.delegatedStake.toString() !== BigNumber.from(0).toString()
          ? (Math.pow(p.delegatedOwnStake / totalPoolsOwnStake, 2 / 3) *
              Math.pow(p.delegatedStake / totalDelegatedStake, 1 / 3) *
              ((1_000_000 - p.operatorShare) / 1_000_000) *
              ((Number(supplyAmount?.quotient) * 2) / 100)) /
            p.delegatedStake
          : 0
      return apr
    })
  }, [delegatedStakes, delegatedOwnStakes, stakingPools, supplyAmount, totalDelegatedStake, totalPoolsOwnStake])

  const loading = poolsLoading || stakesLoading || ownStakesLoading

  return {
    loading,
    stakingPools: stakingPools?.map((pool, i) => ({
      ...pool,
      id: inputs[i][0],
      apr: aprs ? aprs[i] : 0,
      operatorShare: stakingPools[i].operatorShare,
      delegatedStake: delegatedStakes ? delegatedStakes[i].delegatedStake : 0,
      poolOwnStake: delegatedOwnStakes ? delegatedOwnStakes[i].poolOwnStake : 0,
    })),
  }
}