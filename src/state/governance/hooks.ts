import { TransactionResponse } from '@ethersproject/providers'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { GOVERNANCE_ADDRESSES } from 'constants/addresses'
import { PROPOSAL_DESCRIPTION_TEXT } from 'constants/proposals'
import { UNI } from 'constants/tokens'
import { ethers, utils } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import { useGovernanceContracts, useUniContract } from 'hooks/useContract'
import usePrevious from 'hooks/usePrevious'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
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
export function useProposalCount(): Record<string, number> | undefined {
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
      govContracts?.map((contract) => ({
        ...contract.filters.ProposalCreated(),
        fromBlock: 10861678,
        toBlock: 'latest',
      })) ?? undefined,
    [govContracts]
  )

  const previousChainId = usePrevious(chainId)

  useEffect(() => {
    if (!filters || !library || chainId === previousChainId) return
    let stale = false

    if (!formattedEvents) {
      const filterRequests = filters.map((filter) => library.getLogs(filter))
      Promise.all(filterRequests)
        .then((events) => events.flat().reverse())
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
  }, [filters, library, formattedEvents, chainId, previousChainId])

  return formattedEvents
}

// get data for all past and active proposals
export function useAllProposalData() {
  const { chainId } = useActiveWeb3React()
  const proposalCount = useProposalCount()

  const proposalIndexes = useMemo(() => {
    const results: number[][][] = []
    GOVERNANCE_ADDRESSES.forEach((addressMap, i) => {
      results[i] = []
      if (!chainId) {
        return new Array(GOVERNANCE_ADDRESSES.length).fill([], 0)
      }
      const address = addressMap[chainId]
      if (!proposalCount || proposalCount[address] === undefined) {
        return new Array(GOVERNANCE_ADDRESSES.length).fill([], 0)
      }
      for (let j = 1; j <= proposalCount[address]; j++) {
        results[i].push([j])
      }
      return results
    })
    return results.filter((indexArray) => indexArray.length > 0)
  }, [chainId, proposalCount])

  const addresses = useMemo(() => {
    if (!chainId) {
      return []
    }
    return GOVERNANCE_ADDRESSES.map((addressMap) => addressMap[chainId]).filter(
      (address) => proposalCount && proposalCount[address] > 0
    )
  }, [chainId, proposalCount])

  // get metadata from past events
  const formattedEvents = useDataFromEventLogs()

  // get all proposal entities
  const allProposals = useMultipleContractMultipleData(addresses, GovernanceInterface, 'proposals', proposalIndexes)

  // get all proposal states
  const allProposalStates = useMultipleContractMultipleData(addresses, GovernanceInterface, 'state', proposalIndexes)

  if (formattedEvents && allProposals && allProposalStates) {
    allProposals.reverse()
    allProposalStates.reverse()

    return allProposals
      .filter((p, i) => {
        return Boolean(p.result) && Boolean(allProposalStates[i]?.result) && Boolean(formattedEvents[i])
      })
      .map((p, i) => {
        const description = PROPOSAL_DESCRIPTION_TEXT[allProposals.length - i - 1] || formattedEvents[i].description
        const formattedProposal: ProposalData = {
          id: allProposals[i]?.result?.id.toString(),
          title: description?.split(/# |\n/g)[1] || 'Untitled',
          description: description || 'No description.',
          proposer: allProposals[i]?.result?.proposer,
          status: allProposalStates[i]?.result?.[0] ?? ProposalState.Undetermined,
          forCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.forVotes.toString(), 18)),
          againstCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.againstVotes.toString(), 18)),
          startBlock: parseInt(allProposals[i]?.result?.startBlock?.toString()),
          endBlock: parseInt(allProposals[i]?.result?.endBlock?.toString()),
          details: formattedEvents[i].details,
        }
        return formattedProposal
      })
  } else {
    return []
  }
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
