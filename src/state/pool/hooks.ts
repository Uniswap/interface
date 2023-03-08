import { Interface } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
import { Contract } from '@ethersproject/contracts'
import type { TransactionResponse } from '@ethersproject/providers'
import { parseBytes32String } from '@ethersproject/strings'
import { useWeb3React } from '@web3-react/core'
import POOL_EXTENDED_ABI from 'abis/pool-extended.json'
import RB_POOL_FACTORY_ABI from 'abis/rb-pool-factory.json'
import RB_REGISTRY_ABI from 'abis/rb-registry.json'
import { RB_FACTORY_ADDRESSES, RB_REGISTRY_ADDRESSES } from 'constants/addresses'
import { useContract } from 'hooks/useContract'
import { useCallback, useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { SupportedChainId } from '../../constants/chains'
//import { useMultipleContractSingleData } from '../../lib/hooks/multicall'
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
  fromBlock?: number,
  toBlock?: number
): PoolRegisteredLog[] | undefined {
  // create filters for Registered events
  const filter = useMemo(() => {
    // we do not poll events until account is connected
    if (!account) return undefined

    const filter = contract?.filters?.Registered()
    if (!filter) return undefined
    return {
      ...filter,
      fromBlock,
      toBlock,
    }
  }, [account, contract, fromBlock, toBlock])

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

    if (registry && !formattedLogsV1) {
      return { data: [], loading: true }
    }

    return { data: formattedLogsV1, loading: false }
  }, [account, formattedLogsV1, registry])
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

export function useRegisteredPools(chainId: number | undefined): PoolRegisteredLog[] | undefined {
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
