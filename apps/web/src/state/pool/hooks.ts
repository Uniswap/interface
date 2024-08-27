import { Interface } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import type { TransactionResponse } from '@ethersproject/providers'
import { parseBytes32String } from '@ethersproject/strings'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { RB_FACTORY_ADDRESSES, RB_REGISTRY_ADDRESSES } from 'constants/addresses'
import { POOLS_LIST } from 'constants/lists'
import { ZERO_ADDRESS } from 'constants/misc'
import { GRG } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import usePrevious from 'hooks/usePrevious'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { CallStateResult, useMultipleContractSingleData, useSingleContractMultipleData } from 'lib/hooks/multicall'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useActiveSmartPool, useSelectActiveSmartPool } from 'state/application/hooks'
import { useStakingContract } from 'state/governance/hooks'
import { useAppSelector } from 'state/hooks'
import { useLogs } from 'state/logs/hooks'
import { filterToKey } from 'state/logs/utils'
import { usePoolsFromUrl } from 'state/lists/poolsList/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import POOL_EXTENDED_ABI from 'uniswap/src/abis/pool-extended.json'
import RB_POOL_FACTORY_ABI from 'uniswap/src/abis/rb-pool-factory.json'
import RB_REGISTRY_ABI from 'uniswap/src/abis/rb-registry.json'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { calculateGasMargin } from 'utils/calculateGasMargin'

//const PoolInterface = new Interface(POOL_EXTENDED_ABI)
const RegistryInterface = new Interface(RB_REGISTRY_ABI)

export function useRegistryContract(): Contract | null {
  const account = useAccount()
  return useContract(
    account.chainId ? RB_REGISTRY_ADDRESSES[account.chainId] : undefined,
    RB_REGISTRY_ABI,
    true,
  )
}

function usePoolFactoryContract(): Contract | null {
  const account = useAccount()
  return useContract(
    account.chainId ? RB_FACTORY_ADDRESSES[account.chainId] : undefined,
    RB_POOL_FACTORY_ABI,
    true,
  )
}

export function usePoolExtendedContract(poolAddress: string | undefined): Contract | null {
  return useContract(poolAddress, POOL_EXTENDED_ABI, true)
}

// TODO: id should be optional as not returned in pools from url
export interface PoolRegisteredLog {
  group?: string
  pool: string
  name: string
  symbol: string
  id: string
  userHasStake?: boolean
}

function useStartBlock(chainId: number | undefined): number | undefined {
  let registryStartBlock
  const blockNumber = useBlockNumber()

  if (chainId === UniverseChainId.Mainnet) {
    registryStartBlock = 15834693
  } else if (chainId === UniverseChainId.Goerli) {
    registryStartBlock = 7807806
  } else if (chainId === UniverseChainId.ArbitrumOne) {
    registryStartBlock = 35439804
  } else if (chainId === UniverseChainId.Optimism) {
    registryStartBlock = 34629059
  } else if (chainId === UniverseChainId.Polygon) {
    registryStartBlock = 35228892
  } else if (chainId === UniverseChainId.Base) {
    registryStartBlock = typeof blockNumber === 'number' ? blockNumber - 4000 : blockNumber
  } else if (chainId === UniverseChainId.Bnb) {
    registryStartBlock = typeof blockNumber === 'number' ? blockNumber - 4000 : blockNumber
  } else {
    registryStartBlock = undefined
  }

  return registryStartBlock
}

/**
 * Need pool events to get list of pools by owner.
 */
function useFormattedPoolCreatedLogs(contract: Contract | null, fromBlock: number): PoolRegisteredLog[] | undefined {
  // create filters for Registered events
  const filter = useMemo(() => {
    const logFilter = contract?.filters?.Registered()
    if (!logFilter) {
      return undefined
    }
    return {
      ...logFilter,
      fromBlock,
    }
  }, [contract, fromBlock])

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
  const account = useAccount()
  const registry = useRegistryContract()
  const blockNumber = useBlockNumber()

  // get metadata from past events
  let registryStartBlock

  if (account.chainId === UniverseChainId.Mainnet) {
    registryStartBlock = 15834693
  } else if (account.chainId === UniverseChainId.Goerli) {
    registryStartBlock = 7807806
  } else if (account.chainId === UniverseChainId.ArbitrumOne) {
    registryStartBlock = 35439804
  } else if (account.chainId === UniverseChainId.Optimism) {
    registryStartBlock = 34629059
  } else if (account.chainId === UniverseChainId.Polygon) {
    registryStartBlock = 35228892
  } else if (account.chainId === UniverseChainId.Base && blockNumber) {
    registryStartBlock = typeof blockNumber === 'number' ? blockNumber - 4000 : blockNumber
  } else if (account.chainId === UniverseChainId.Bnb && blockNumber) {
    registryStartBlock = typeof blockNumber === 'number' ? blockNumber - 4000 : blockNumber
  } else {
    registryStartBlock = blockNumber as number
  }

  const formattedLogsV1: PoolRegisteredLog[] | undefined = useFormattedPoolCreatedLogs(registry, registryStartBlock)

  const poolsFromList = usePoolsFromList(registry, account.chainId)

  // early return until events are fetched
  return useMemo(() => {
    // we append pools from url and filter for duplicates in case the rpc endpoint is down or slow.
    // eslint-disable-next-line
    const pools: PoolRegisteredLog[] = ([...(formattedLogsV1 ?? []), ...(poolsFromList ?? [])])

    const uniquePools = pools.filter((obj, index) => {
      return index === pools.findIndex((o) => obj.pool === o.pool)
    })

    if (registry && !formattedLogsV1 && !poolsFromList) {
      return { data: [], loading: true }
    }

    return { data: uniquePools, loading: false }
  }, [formattedLogsV1, registry, poolsFromList])
}

// Bsc endpoints have eth_getLogs limit, so we query pools before recent history from pools list endpoint
export function usePoolsFromList(
  regitry: Contract | null,
  chainId: number | undefined
): PoolRegisteredLog[] | undefined {
  const poolsFromList = usePoolsFromUrl(POOLS_LIST)
  const pools = useMemo(
    () => poolsFromList?.filter((n) => n.chainId === Number(chainId ?? 1)),
    [chainId, poolsFromList]
  )
  const poolAddresses = useMemo(() => pools?.map((p) => [p.address]), [pools])
  const result = useSingleContractMultipleData(regitry, 'getPoolIdFromAddress', poolAddresses ?? [])
  //const poolsLoading = useMemo(() => result.some(({ loading }) => loading), [result])
  //const poolsError = useMemo(() => result.some(({ error }) => error), [result])
  return useMemo(() => {
    //if (poolsLoading || poolsError) return undefined
    const poolIds = result.map((call) => {
      const result = call?.result as CallStateResult
      return result?.[0]
    })
    return pools?.map((p, i) => {
      const pool = p.address
      const name = p.name
      const symbol = p.symbol
      const id = poolIds[i]

      return { pool, name, symbol, id }
    })
  }, [pools, /*poolsLoading, poolsError,*/ result])
}

export function useCreateCallback(): (
  name: string | undefined,
  symbol: string | undefined,
  currencyValue: Currency | undefined
) => undefined | Promise<string> {
  const account = useAccount()
  const { provider } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const factoryContract = usePoolFactoryContract()

  return useCallback(
    (name: string | undefined, symbol: string | undefined, currencyValue: Currency | undefined) => {
      const parsedAddress = currencyValue?.isNative ? ZERO_ADDRESS : currencyValue?.address
      // TODO: check name and symbol assertions
      //if (!provider || !chainId || !account || name === '' || symbol === '' || !isAddress(parsedAddress ?? ''))
      if (!provider || !account.chainId || !account.address || !name || !symbol || !parsedAddress || !isAddress(parsedAddress ?? '')) {
        return undefined
      }
      if (currencyValue?.chainId !== account.chainId) {
        throw new Error('User Switched Wallet On Open Create Modal')
      }
      if (!factoryContract) {
        throw new Error('No Factory Contract!')
      }
      return factoryContract.estimateGas.createPool(name, symbol, parsedAddress, {}).then((estimatedGasLimit) => {
        return factoryContract
          .createPool(name, symbol, parsedAddress, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.CREATE_V3_POOL,
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, account.chainId, provider, factoryContract]
  )
}

export function useRegisteredPools(): PoolRegisteredLog[] | undefined {
  const account = useAccount()
  const registry = useRegistryContract()
  const fromBlock = useStartBlock(account.chainId)
  // create filters for Registered events
  const filter = useMemo(() => {
    const filter = registry?.filters?.Registered()
    if (!filter) {
      return undefined
    }
    return {
      ...filter,
      fromBlock,
    }
  }, [registry, fromBlock])
  const logs = useAppSelector((state) => state.logs)
  if (!account.chainId || !filter) {
    return []
  }
  const state = logs[account.chainId]?.[filterToKey(filter)]
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
  const account = useAccount()
  const { provider } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const { poolAddress: poolAddressFromUrl } = useParams<{ poolAddress?: string }>()
  const poolContract = usePoolExtendedContract(poolAddressFromUrl ?? undefined)

  return useCallback(
    (lockup: string | undefined) => {
      if (!provider || !account.chainId || !account.address) {
        return undefined
      }
      if (!poolContract) {
        throw new Error('No Pool Contract!')
      }
      return poolContract.estimateGas.changeMinPeriod(lockup, {}).then((estimatedGasLimit) => {
        return poolContract
          .changeMinPeriod(lockup, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.SET_LOCKUP,
            })
            return response.hash
          })
      })
    },
    [account.address, account.chainId, provider, poolContract, addTransaction]
  )
}

export function useSetSpreadCallback(): (spread: string | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const { provider } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const { poolAddress: poolAddressFromUrl } = useParams<{ poolAddress?: string }>()
  const poolContract = usePoolExtendedContract(poolAddressFromUrl ?? undefined)

  return useCallback(
    (spread: string | undefined) => {
      if (!provider || !account.chainId || !account.address) {
        return undefined
      }
      if (!poolContract) {
        throw new Error('No Pool Contract!')
      }
      return poolContract.estimateGas.changeSpread(spread, {}).then((estimatedGasLimit) => {
        return poolContract
          .changeSpread(spread, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.SET_SPREAD,
            })
            return response.hash
          })
      })
    },
    [account.address, account.chainId, provider, poolContract, addTransaction]
  )
}

export function useSetValueCallback(): (value: string | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const { provider } = useWeb3React()
  const addTransaction = useTransactionAdder()

  const { poolAddress: poolAddressFromUrl } = useParams<{ poolAddress?: string }>()
  const poolContract = usePoolExtendedContract(poolAddressFromUrl ?? undefined)

  return useCallback(
    (value: string | undefined) => {
      if (!provider || !account.chainId || !account.address) {
        return undefined
      }
      if (!poolContract) {
        throw new Error('No Pool Contract!')
      }
      return poolContract.estimateGas.setUnitaryValue(value, {}).then((estimatedGasLimit) => {
        return poolContract
          .setUnitaryValue(value, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.SET_VALUE,
            })
            return response.hash
          })
      })
    },
    [account.address, account.chainId, provider, poolContract, addTransaction]
  )
}

interface StakingPools {
  id: string
  operatorShare: number
  apr: number
  irr?: number
  delegatedStake: BigNumber
  poolOwnStake: BigNumber
}

interface UseStakingPools {
  loading: boolean
  stakingPools?: StakingPools[]
}

export function useStakingPoolsRewards(poolIds: string[] | undefined) {
  const stakingContract = useStakingContract()

  const inputs = useMemo(() => (poolIds ? poolIds.map((poolId) => [poolId]) : []), [poolIds])
  const results = useSingleContractMultipleData(stakingContract, 'getStakingPoolStatsThisEpoch', inputs)
  return useMemo(() => {
    return results.map((call) => {
      const result = call.result as CallStateResult
      return result?.[0].feesCollected
    })
  }, [results])
}

export function useStakingPools(addresses: string[] | undefined, poolIds: string[] | undefined): UseStakingPools {
  const stakingContract = useStakingContract()

  const inputs = useMemo(() => (poolIds ? poolIds.map((poolId) => [poolId]) : []), [poolIds])
  const poolAddresses = useMemo(() => (addresses ? addresses.map((address) => [address, 1]) : []), [addresses])

  const poolsData = useSingleContractMultipleData(stakingContract, 'getStakingPool', inputs)
  const poolsStakes = useSingleContractMultipleData(stakingContract, 'getTotalStakeDelegatedToPool', inputs)
  // TODO: if we allow pools to stake pools other then self we'll have to use getStakeDelegatedToPoolByOwner
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
          operatorShare: result?.[0].operatorShare,
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
          delegatedStake: result?.[0].nextEpochBalance,
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
          poolOwnStake: result?.[0].nextEpochBalance,
        }
      })
    }
    return undefined
  }, [ownStakesLoading, ownStakesError, addresses, poolIds, poolsOwnStakes])

  const totalDelegatedStake = delegatedStakes?.reduce((prev, curr) => prev + Number(curr.delegatedStake), 0)
  const totalPoolsOwnStake = delegatedOwnStakes?.reduce((prev, curr) => prev + Number(curr.poolOwnStake), 0)
  // TODO: check if should pass supply from parent
  const account = useWeb3React()
  const supplyAmount = useTotalSupply(GRG[account.chainId ?? 1])

  const yieldData = useMemo(() => {
    if (!delegatedStakes || !delegatedOwnStakes || !totalDelegatedStake || !totalPoolsOwnStake || !supplyAmount) {
      return undefined
    }
    const poolsInfo = stakingPools?.map((pool, i) => ({
      ...pool,
      operatorShare: stakingPools[i].operatorShare,
      delegatedStake: delegatedStakes[i].delegatedStake,
      delegatedOwnStake: delegatedOwnStakes[i].poolOwnStake,
    }))

    return poolsInfo?.map((p) => {
      // if we want to return NaN when pool has no delegated stake, we can remove the following assertion
      const reward =
        Math.pow(p.delegatedOwnStake / totalPoolsOwnStake, 2 / 3) *
        Math.pow(p.delegatedStake / totalDelegatedStake, 1 / 3) *
        ((Number(supplyAmount?.quotient) * 2) / 100)
      const apr =
        p.delegatedStake.toString() !== BigNumber.from(0).toString()
          ? (reward * ((1_000_000 - p.operatorShare) / 1_000_000)) / p.delegatedStake
          : 0
      const irr =
        p.delegatedOwnStake.toString() !== BigNumber.from(0).toString()
          ? (reward * (p.operatorShare / 1_000_000)) / p.delegatedOwnStake
          : 0
      return { apr, irr }
    })
  }, [delegatedStakes, delegatedOwnStakes, stakingPools, supplyAmount, totalDelegatedStake, totalPoolsOwnStake])

  const loading = poolsLoading || stakesLoading || ownStakesLoading

  return {
    loading,
    stakingPools: stakingPools?.map((pool, i) => ({
      ...pool,
      id: inputs[i][0],
      apr: yieldData ? yieldData[i]?.apr : 0,
      irr: yieldData ? yieldData[i]?.irr : 0,
      operatorShare: stakingPools[i].operatorShare,
      delegatedStake: delegatedStakes ? delegatedStakes[i].delegatedStake : 0,
      poolOwnStake: delegatedOwnStakes ? delegatedOwnStakes[i].poolOwnStake : 0,
    })),
  }
}

export function useOperatedPools() {
  // TODO: the following is expensive as overwrites all pools data, however it is called just once. It is useful when
  //  switching chain in the swap page s otherwise the state is cleared when page is reloaded.
  //  We sould try and update state only if poolsLogs is undefined
  //const poolsLogs = useRegisteredPools()
  const { data: poolsLogs } = useAllPoolsData()
  const poolAddresses: (string | undefined)[] = useMemo(() => {
    if (!poolsLogs) {
      return []
    }

    return poolsLogs.map((p) => p.pool)
  }, [poolsLogs])
  const PoolInterface = new Interface(POOL_EXTENDED_ABI)
  const results = useMultipleContractSingleData(poolAddresses, PoolInterface, 'getPool')

  const account = useAccount()
  const prevAccount = usePrevious(account.address)
  const accountChanged = prevAccount && prevAccount !== account.address

  // TODO: careful: on swap page returns [], only by goint to 'Mint' page will it query events
  const operatedPools: Token[] | undefined = useMemo(() => {
    if (!account.address || !account.chainId || !results || !poolAddresses) {
      return
    }
    const mockToken = new Token(0, account.address, 1)
    return results
      .map((result, i) => {
        const { result: pools, loading } = result
        const poolAddress = poolAddresses[i]

        if (loading || !pools || !pools?.[0] || !poolAddress) {
          return mockToken
        }
        //const parsed: PoolInitParams[] | undefined = pools?.[0]
        const { name, symbol, decimals, owner } = pools[0]
        if (!name || !symbol || !decimals || !owner || !poolAddress) {
          return mockToken
        }
        //const poolWithAddress: PoolWithAddress = { name, symbol, decimals, owner, poolAddress }
        const isPoolOperator = owner === account.address
        if (!isPoolOperator) {
          return mockToken
        }
        return new Token(account.chainId ?? UniverseChainId.Mainnet, poolAddress, decimals, symbol, name)
      })
      .filter((p) => p !== mockToken)
    //.filter((p) => account.address === owner)
  }, [account.address, account.chainId, poolAddresses, results])

  const defaultPool = useMemo(() => {
    if (!operatedPools) {
      return
    }
    return operatedPools[0]
  }, [operatedPools])

  const activeSmartPool = useActiveSmartPool()

  const onPoolSelect = useSelectActiveSmartPool()

  useEffect(() => {
    // Initialize default pool
    if (defaultPool && (!activeSmartPool?.address || activeSmartPool.address === null)) {
      onPoolSelect(defaultPool)
    } else if (!defaultPool && activeSmartPool?.address) {
      onPoolSelect()
    } else if (accountChanged) {
      onPoolSelect(defaultPool)
    }
  }, [defaultPool, activeSmartPool.address, onPoolSelect, accountChanged])

  return operatedPools
}
