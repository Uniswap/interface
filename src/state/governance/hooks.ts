import { TransactionResponse } from '@ethersproject/providers'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { GOVERNANCE_ADDRESSES } from 'constants/addresses'
import { UNISWAP_GRANTS_PROPOSAL_DESCRIPTION } from 'constants/proposals/uniswap_grants_proposal_description'
import { ethers, utils } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import { useGovernanceContracts, useUniContract } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { EDUCATION_FUND_1_START_BLOCK, UNISWAP_GRANTS_START_BLOCK } from '../../constants/proposals'
import { UNI } from '../../constants/tokens'
import { useMultipleContractMultipleData, useMultipleContractSingleData, useSingleCallResult } from '../multicall/hooks'
import { useTransactionAdder } from '../transactions/hooks'

interface ProposalDetail {
  target: string
  functionSig: string
  callData: string
}

export interface ProposalData {
  id: string
  title: string
  description: string
  proposer: string
  status: ProposalState
  forCount: number
  againstCount: number
  startBlock: number
  endBlock: number
  details: ProposalDetail[]
}

export enum ProposalState {
  Undetermined = -1,
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

const GovernanceInterface = new ethers.utils.Interface(GOV_ABI)
// get count of all proposals made
export function useProposalCounts(): Record<string, number> | undefined {
  const { chainId } = useActiveWeb3React()
  const addresses = useMemo(() => {
    if (!chainId) {
      return []
    }
    return GOVERNANCE_ADDRESSES.map((addressMap) => addressMap[chainId])
  }, [chainId])
  const responses = useMultipleContractSingleData(addresses, GovernanceInterface, 'proposalCount')
  return useMemo(() => {
    return responses.reduce((acc, response, i) => {
      if (response.result && !response.loading) {
        return {
          ...acc,
          [addresses[i]]: parseInt(response.result[0]),
        }
      }
      return acc
    }, {})
  }, [addresses, responses])
}

/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
export function useDataFromEventLogs() {
  const { library, chainId } = useActiveWeb3React()
  const [formattedEvents, setFormattedEvents] =
    useState<{ description: string; details: { target: string; functionSig: string; callData: string }[] }[]>()
  const govContracts = useGovernanceContracts()

  // create filter for these specific events
  const filters = useMemo(
    () =>
      govContracts
        ? govContracts.map((contract) => ({
            ...contract.filters.ProposalCreated(),
            fromBlock: 10861678,
            toBlock: 'latest',
          }))
        : undefined,
    [govContracts]
  )

  useEffect(() => {
    if (!filters || !library) return
    let stale = false

    if (!formattedEvents) {
      const filterRequests = filters.map((filter) => library.getLogs(filter))
      Promise.all(filterRequests)
        .then((events) => events.flat())
        .then((governanceContractsProposalEvents) => {
          if (stale) return
          const formattedEventData = governanceContractsProposalEvents.map((event) => {
            const eventParsed = GovernanceInterface.parseLog(event).args
            return {
              description: eventParsed.description,
              details: eventParsed.targets.map((target: string, i: number) => {
                const signature = eventParsed.signatures[i]
                const [name, types] = signature.substr(0, signature.length - 1).split('(')
                const calldata = eventParsed.calldatas[i]
                const decoded = utils.defaultAbiCoder.decode(types.split(','), calldata)
                return {
                  target,
                  functionSig: name,
                  callData: decoded.join(', '),
                }
              }),
            }
          })
          setFormattedEvents(formattedEventData)
        })
        .catch((error) => {
          console.error('Failed to fetch proposals', error)
        })
      return () => {
        stale = true
      }
    }

    return
  }, [filters, library, formattedEvents, chainId])

  return formattedEvents
}

// get data for all past and active proposals
export function useAllProposalData() {
  const { chainId } = useActiveWeb3React()
  const proposalCounts = useProposalCounts()

  const proposalIndexes = useMemo(() => {
    const results: number[][][] = []
    const emptyState = new Array(GOVERNANCE_ADDRESSES.length).fill([], 0)
    GOVERNANCE_ADDRESSES.forEach((addressMap, i) => {
      results[i] = []
      if (!chainId) {
        return emptyState
      }
      const address = addressMap[chainId]
      if (!proposalCounts || proposalCounts[address] === undefined) {
        return emptyState
      }
      for (let j = 1; j <= proposalCounts[address]; j++) {
        results[i].push([j])
      }
      return results
    })
    return results.filter((indexArray) => indexArray.length > 0)
  }, [chainId, proposalCounts])

  const addresses = useMemo(() => {
    if (!chainId) {
      return []
    }
    return GOVERNANCE_ADDRESSES.map((addressMap) => addressMap[chainId]).filter(
      (address) => proposalCounts && proposalCounts[address] > 0
    )
  }, [chainId, proposalCounts])

  // get metadata from past events
  const formattedEvents = useDataFromEventLogs()

  // get all proposal entities
  const allProposalsCallData = useMultipleContractMultipleData(
    addresses,
    GovernanceInterface,
    'proposals',
    proposalIndexes
  ).flat()

  // get all proposal states
  const allProposalStatesCallData = useMultipleContractMultipleData(
    addresses,
    GovernanceInterface,
    'state',
    proposalIndexes
  ).flat()

  if (
    !allProposalsCallData?.every((p) => Boolean(p.result)) ||
    !allProposalStatesCallData?.every((p) => Boolean(p.result)) ||
    !formattedEvents?.every((p) => Boolean(p))
  ) {
    return []
  }

  const omittedProposalStartBlocks = [EDUCATION_FUND_1_START_BLOCK]

  return allProposalsCallData
    .map((proposal, i) => {
      let description = formattedEvents[i].description
      const startBlock = parseInt(proposal?.result?.startBlock?.toString())
      if (startBlock === UNISWAP_GRANTS_START_BLOCK) {
        description = UNISWAP_GRANTS_PROPOSAL_DESCRIPTION
      }
      return {
        id: proposal?.result?.id.toString(),
        title: description?.split(/# |\n/g)[1] ?? 'Untitled',
        description: description ?? 'No description.',
        proposer: proposal?.result?.proposer,
        status: allProposalStatesCallData[i]?.result?.[0] ?? ProposalState.Undetermined,
        forCount: parseFloat(ethers.utils.formatUnits(proposal?.result?.forVotes.toString(), 18)),
        againstCount: parseFloat(ethers.utils.formatUnits(proposal?.result?.againstVotes.toString(), 18)),
        startBlock,
        endBlock: parseInt(proposal?.result?.endBlock?.toString()),
        details: formattedEvents[i].details,
      }
    })
    .filter((proposal) => !omittedProposalStartBlocks.includes(proposal.startBlock))
}

export function useProposalData(id: string): ProposalData | undefined {
  const allProposalData = useAllProposalData()
  return allProposalData?.find((p) => p.id === id)
}

// get the users delegatee if it exists
export function useUserDelegatee(): string {
  const { account } = useActiveWeb3React()
  const uniContract = useUniContract()
  const { result } = useSingleCallResult(uniContract, 'delegates', [account ?? undefined])
  return result?.[0] ?? undefined
}

// gets the users current votes
export function useUserVotes(): CurrencyAmount<Token> | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const uni = chainId ? UNI[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])?.result?.[0]
  return votes && uni ? CurrencyAmount.fromRawAmount(uni, votes) : undefined
}

// fetch available votes as of block (usually proposal start block)
export function useUserVotesAsOfBlock(block: number | undefined): CurrencyAmount<Token> | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const uni = chainId ? UNI[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getPriorVotes', [account ?? undefined, block ?? undefined])
    ?.result?.[0]
  return votes && uni ? CurrencyAmount.fromRawAmount(uni, votes) : undefined
}

export function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string> {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const uniContract = useUniContract()

  return useCallback(
    (delegatee: string | undefined) => {
      if (!library || !chainId || !account || !isAddress(delegatee ?? '')) return undefined
      const args = [delegatee]
      if (!uniContract) throw new Error('No UNI Contract!')
      return uniContract.estimateGas.delegate(...args, {}).then((estimatedGasLimit) => {
        return uniContract
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Delegated votes`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, library, uniContract]
  )
}

export function useVoteCallback(): {
  voteCallback: (proposalId: string | undefined, support: boolean) => undefined | Promise<string>
} {
  const { account } = useActiveWeb3React()

  const govContracts = useGovernanceContracts()
  const latestGovernanceContract = govContracts ? govContracts[0] : null
  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !latestGovernanceContract || !proposalId) return
      const args = [proposalId, support]
      return latestGovernanceContract.estimateGas.castVote(...args, {}).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract]
  )
  return { voteCallback }
}
