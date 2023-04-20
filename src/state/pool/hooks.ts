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
import { GRG } from 'constants/tokens'
import { useContract } from 'hooks/useContract'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useStakingContract } from 'state/governance/hooks'
import { useAppSelector } from 'state/hooks'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { SupportedChainId } from '../../constants/chains'
import { CallStateResult, useSingleContractMultipleData } from '../../lib/hooks/multicall'
import { AppState } from '../index'
import { useLogs } from '../logs/hooks'
import { filterToKey } from '../logs/utils'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionType } from '../transactions/types'

//const PoolInterface = new Interface(POOL_EXTENDED_ABI)
const RegistryInterface = new Interface(RB_REGISTRY_ABI)

// TODO: create pool state in ../index and create pool reducer if we want to store pool data in state
// actually we do want to store them in state as we want to query pool address and name from state
//  check variable renaming to avoid confusion with liquidity pools
export function usePoolState(): AppState['swap'] {
  return useAppSelector((state) => state.swap)
}

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
  group: string
  pool: string
  name: string
  symbol: string
  id: string
}

export interface PoolData {
  name: string
  symbol: string
  decimals: number
  owner: string
  baseToken: string
}

function useStartBlock(chainId: number | undefined): number | undefined {
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
    registryStartBlock = 25549625
  } else {
    registryStartBlock = undefined
  }

  return registryStartBlock
}

/**
 * Need pool events to get list of pools by owner.
 */
export function useFormattedPoolCreatedLogs(
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

export function useAllPoolsData(): { data: PoolRegisteredLog[] | undefined; loading: boolean } {
  const { account, chainId } = useWeb3React()
  const registry = useRegistryContract()

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
    registryStartBlock = 25549625
  } else {
    registryStartBlock = 1
  }

  // we want to be able to filter by account
  const formattedLogsV1: PoolRegisteredLog[] | undefined = useFormattedPoolCreatedLogs(
    registry,
    account,
    registryStartBlock
  )

  // early return until events are fetched
  return useMemo(() => {
    //const formattedLogs = [...(formattedLogsV1 ?? [])]

    // prevent display if wallet not connected
    if (!account) {
      return { data: undefined, loading: false }
    }

    // TODO: check why quicknode returns error on log query, seems app keeps calling infura
    // prevent display of bsc loader until fix quicknode rpc returned error
    if (chainId === 56 && registry && !formattedLogsV1) {
      return { data: [], loading: false }
    }

    if (registry && !formattedLogsV1) {
      return { data: [], loading: true }
    }

    return { data: formattedLogsV1, loading: false }
  }, [account, chainId, formattedLogsV1, registry])
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
  stakingPools: StakingPools[] | undefined
}

export function useStakingPools(addresses: string[] | undefined, poolIds: string[] | undefined): UseStakingPools {
  const stakingContract = useStakingContract()

  const inputs = useMemo(() => (poolIds ? poolIds.map((poolId) => [poolId]) : []), [poolIds])
  const poolAddresses = useMemo(() => (addresses ? addresses.map((address) => [address]) : []), [addresses])

  const poolsData = useSingleContractMultipleData(stakingContract, 'getStakingPool', inputs)
  const poolsStakes = useSingleContractMultipleData(stakingContract, 'getTotalStakeDelegatedToPool', inputs)
  const poolsOwnStakes = useSingleContractMultipleData(stakingContract, 'getTotalStakeDelegatedToPoolByOwner', [
    ...inputs,
    poolAddresses,
  ])

  const stakingPools = useMemo(() => {
    if (poolIds) {
      return poolsData.map((call, i) => {
        const id = poolIds[i]
        const result = call.result as CallStateResult
        return {
          id,
          operatorShare: result.operatorShare,
        }
      })
    }
    return undefined
  }, [poolIds, poolsData])

  const delegatedStakes = useMemo(() => {
    if (addresses && poolIds) {
      return poolsStakes.map((call, i) => {
        const id = poolIds[i]
        const result = call.result as CallStateResult
        return {
          id,
          delegatedStake: result.nextEpochBalance,
        }
      })
    }
    return undefined
  }, [addresses, poolIds, poolsStakes])

  const delegatedOwnStakes = useMemo(() => {
    if (addresses && poolIds) {
      return poolsOwnStakes.map((call, i) => {
        const id = poolIds[i]
        const result = call.result as CallStateResult
        return {
          id,
          poolOwnStake: result.currentEpochBalance,
        }
      })
    }
    return undefined
  }, [addresses, poolIds, poolsOwnStakes])

  const totalDelegatedStake = delegatedStakes?.reduce((prev, curr, index, array) => prev + curr.delegatedStake, 0)
  const totalPoolsOwnStake = delegatedOwnStakes?.reduce((prev, curr, index, array) => prev + curr.poolOwnStake, 0)
  // TODO: query exact total supply per chain and check if should pass from parent
  const { chainId } = useWeb3React()
  const totalSupply = 10000000e18
  const supplyAmount = useTotalSupply(GRG[chainId ?? 1])
  console.log(supplyAmount?.quotient)

  const aprs = useMemo(() => {
    if (!delegatedStakes || !delegatedOwnStakes || !totalDelegatedStake || !totalPoolsOwnStake) return undefined
    const poolsInfo = stakingPools?.map((pool, i) => ({
      ...pool,
      operatorShare: stakingPools[i].operatorShare,
      delegatedStake: delegatedStakes[i].delegatedStake,
      delegatedOwnStakes: delegatedOwnStakes[i].poolOwnStake,
    }))
    return poolsInfo?.map((p, i) => {
      const apr =
        (((p.delegatedOwnStakes / totalPoolsOwnStake) ^ (2 / 3)) *
          ((p.delegatedStake / totalDelegatedStake) ^ (1 / 3)) *
          (1 - p.operatorShare / 10000) *
          ((2 / 100) * totalSupply)) /
        p.delegatedOwnStakes

      return apr
    })
  }, [delegatedStakes, delegatedOwnStakes, stakingPools, totalDelegatedStake, totalPoolsOwnStake])
  const loading = false

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
