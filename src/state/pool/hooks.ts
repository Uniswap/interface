import { Interface } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
//import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import type { TransactionResponse } from '@ethersproject/providers'
import { parseBytes32String } from '@ethersproject/strings'
// eslint-disable-next-line no-restricted-imports
//import { t } from '@lingui/macro'
//import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import POOL_EXTENDED_ABI from 'abis/pool-extended.json'
import RB_POOL_FACTORY_ABI from 'abis/rb-pool-factory.json'
import RB_REGISTRY_ABI from 'abis/rb-registry.json'
import { RB_FACTORY_ADDRESSES, RB_REGISTRY_ADDRESSES } from 'constants/addresses'
import { useContract } from 'hooks/useContract'
import { useSingleCallResult /*, useSingleContractMultipleData*/ } from 'lib/hooks/multicall'
import { useCallback, useMemo } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { SupportedChainId } from '../../constants/chains'
import { useLogs } from '../logs/hooks'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionType } from '../transactions/types'

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

/*
const FOUR_BYTES_DIR: { [sig: string]: string } = {
  '0x5ef2c7f0': 'setSubnodeRecord(bytes32,bytes32,address,address,uint64)',
  '0x10f13a8c': 'setText(bytes32,string,string)',
  '0xb4720477': 'sendMessageToChild(address,bytes)',
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x7b1837de': 'fund(address,uint256)',
}
*/

// TODO: we must send array of pool addresses and query owners in a multicall, otherwise events query make 1 call per created pool
export function usePoolOperator(poolAddress: string | undefined): string | undefined {
  const contract = usePoolExtendedContract(poolAddress)
  const { result } = useSingleCallResult(contract, 'getPool')

  return result?.[3]?.toString()
}

/**
 * Need pool events to get list of pools by owner.
 */
export function useFormattedPoolCreatedLogs(
  contract: Contract | null,
  operator?: string | undefined,
  fromBlock?: number,
  toBlock?: number
): PoolRegisteredLog[] | undefined {
  // create filters for ProposalCreated events
  const filter = useMemo(() => {
    const filter = contract?.filters?.Registered()
    if (!filter) return undefined
    return {
      ...filter,
      fromBlock,
      toBlock,
    }
  }, [contract, fromBlock, toBlock])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return (
      useLogsResult?.logs
        ?.map((log) => {
          const parsed = RegistryInterface.parseLog(log).args
          return parsed
        })
        //.filter((p) => p.governorIndex === governorIndex)?.find((p) => p.id === id)
        //?.filter((parsed) => indices.flat().some((i) => i === parsed.id.toNumber()))
        // TODO: filter by pool operator, if cannot do efficient hook must query all "Pool Initialized"
        // events, filtered by group, then map those owned, but must add pools that changed ownership
        //.filter((parsed) => usePoolOperator(parsed.address) === operator)
        //.filter((parsed) => parsed.name === 'mynewPool')
        ?.map((parsed) => {
          // TODO: can simply pass the array from above
          const group = parsed.group
          const pool = parsed.pool
          const name = parseBytes32String(parsed.name)
          const symbol = parseBytes32String(parsed.symbol)
          const id = parsed.id //.toString()

          return { group, pool, name, symbol, id }
        })
    )
  }, [useLogsResult])
}

export function useAllPoolsData(): { data: PoolRegisteredLog[]; loading: boolean } {
  const { account, chainId } = useWeb3React()
  const registry = useRegistryContract()

  // get metadata from past events
  let registryStartBlock

  if (chainId === SupportedChainId.MAINNET) {
    registryStartBlock = 16620590
  } else if (chainId === SupportedChainId.GOERLI) {
    registryStartBlock = 7807806
  } else if (chainId === SupportedChainId.ARBITRUM_ONE) {
    registryStartBlock = 60590354
  } else if (chainId === SupportedChainId.OPTIMISM) {
    registryStartBlock = 74115128
  } else if (chainId === SupportedChainId.POLYGON) {
    registryStartBlock = 39249858
  }

  // we want to be able to filter by account
  const formattedLogsV1: PoolRegisteredLog[] | undefined = useFormattedPoolCreatedLogs(
    registry,
    account,
    registryStartBlock
  )

  // early return until events are fetched
  return useMemo(() => {
    const formattedLogs = [...(formattedLogsV1 ?? [])]
    console.log(formattedLogs)

    if (registry && !formattedLogs) {
      return { data: [], loading: true }
    }

    return { data: formattedLogs, loading: false }
  }, [formattedLogsV1, registry])
}

/*
function countToIndices(count: number | undefined, skip = 0) {
  return typeof count === 'number' ? new Array(count - skip).fill(0).map((_, i) => [i + 1 + skip]) : []
}

// get data for all pools
export function useAllPoolData(): { data: PoolData[]; loading: boolean } {
  const { chainId } = useWeb3React()
  const gov = useGovernanceProxyContract()

  const proposalCount = useProposalCount(gov)

  const govProposalIndexes = useMemo(() => {
    return countToIndices(proposalCount)
  }, [proposalCount])

  // TODO: we can query all proposals by calling proposals()
  //const proposals = useSingleContractMultipleData(gov, 'proposals', govProposalIndexes)
  const proposals = useSingleContractMultipleData(gov, 'getProposalById', govProposalIndexes)

  // get all proposal states
  const proposalStates = useSingleContractMultipleData(gov, 'getProposalState', govProposalIndexes)

  // get metadata from past events
  let govStartBlock

  if (chainId === SupportedChainId.MAINNET) {
    govStartBlock = 16620590
  } else if (chainId === SupportedChainId.GOERLI) {
    govStartBlock = 8485377
  } else if (chainId === SupportedChainId.ARBITRUM_ONE) {
    govStartBlock = 60590354
  } else if (chainId === SupportedChainId.OPTIMISM) {
    govStartBlock = 74115128
  } else if (chainId === SupportedChainId.POLYGON) {
    govStartBlock = 39249858
  }

  const formattedLogsV1 = useFormattedProposalCreatedLogs(gov, govProposalIndexes, govStartBlock)

  // TODO: we must use staked GRG instead
  const uni = useMemo(() => (chainId ? UNI[chainId] : undefined), [chainId])

  // early return until events are fetched
  return useMemo(() => {
    const proposalsCallData = [...proposals]
    const proposalStatesCallData = [...proposalStates]
    // TODO: check what we are doing wrong here
    const formattedLogs = [...(formattedLogsV1 ?? [])]

    if (
      !uni ||
      proposalsCallData.some((p) => p.loading) ||
      proposalStatesCallData.some((p) => p.loading) ||
      (gov && !formattedLogs)
    ) {
      return { data: [], loading: true }
    }

    return {
      data: proposalsCallData.map((proposal, i) => {
        const startBlock = parseInt(proposal?.result?.startBlock?.toString())

        let description = formattedLogs[i]?.description ?? ''
        if (startBlock === UNISWAP_GRANTS_START_BLOCK) {
          description = UNISWAP_GRANTS_PROPOSAL_DESCRIPTION
        }

        let title = description?.split(/#+\s|\n/g)[1]
        if (startBlock === POLYGON_START_BLOCK) {
          title = POLYGON_PROPOSAL_TITLE
        }

        return {
          id: proposal?.result?.id.toString(),
          title: title ?? t`Untitled`,
          description: description ?? t`No description.`,
          proposer: proposal?.result?.proposer,
          status: proposalStatesCallData[i]?.result?.[0] ?? ProposalState.UNDETERMINED,
          forCount: CurrencyAmount.fromRawAmount(uni, proposal?.result?.forVotes),
          againstCount: CurrencyAmount.fromRawAmount(uni, proposal?.result?.againstVotes),
          startBlock,
          endBlock: parseInt(proposal?.result?.endBlock?.toString()),
          eta: proposal?.result?.eta,
          details: formattedLogs[i]?.details,
          governorIndex: 0,
        }
      }),
      loading: false,
    }
  }, [formattedLogsV1, gov, proposalStates, proposals, uni])
}
*/

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
