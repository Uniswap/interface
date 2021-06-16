import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { isAddress } from 'ethers/lib/utils'
import { UNI } from '../../constants/tokens'
import { useGovernanceContracts, useUniContract } from '../../hooks/useContract'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { useSingleCallResult, useSingleContractMultipleData } from '../multicall/hooks'
import { useActiveWeb3React } from '../../hooks/web3'
import { ethers, utils } from 'ethers'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../transactions/hooks'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { UNISWAP_GRANTS_PROPOSAL_DESCRIPTION } from 'constants/proposals/uniswap_grants_proposal_description'

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

// get count of all proposals made on the given governor alpha
function useProposalCount(govContract: ethers.Contract | null): number | undefined {
  const res = useSingleCallResult(govContract, 'proposalCount')
  if (res.result && !res.loading) {
    return parseInt(res.result[0])
  }
  return undefined
}

/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
const eventParser = new ethers.utils.Interface(GOV_ABI)
function useDataFromEventLogs(govContract: ethers.Contract | null) {
  const { library, chainId } = useActiveWeb3React()
  const [formattedEvents, setFormattedEvents] =
    useState<{ description: string; details: { target: string; functionSig: string; callData: string }[] }[]>()

  // create filter for these specific events
  const filter = useMemo(
    () =>
      govContract ? { ...govContract.filters.ProposalCreated(), fromBlock: 10861678, toBlock: 'latest' } : undefined,
    [govContract]
  )

  useEffect(() => {
    if (!filter || !library) return
    let stale = false

    if (!formattedEvents) {
      library
        .getLogs(filter)
        .then((proposalEvents) => {
          if (stale) return
          const formattedEventData = proposalEvents?.map((event) => {
            const eventParsed = eventParser.parseLog(event).args
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
  }, [filter, library, formattedEvents, chainId])

  return formattedEvents
}

// get data for all past and active proposals
export function useAllProposalData(): ProposalData[][] {
  // fetch all governance contracts
  const govContracts = useGovernanceContracts()

  // fetch the proposal count on the active contract
  const proposalCount = useProposalCount(govContracts[govContracts.length - 1])

  // get all proposals for all contracts
  const proposalsIndicesByGovContract = [
    [1, 2, 3, 4], // hardcoded for first governor alpha
    typeof proposalCount === 'number' ? new Array(proposalCount).fill(0).map((_, i) => i + 1) : [], // dynamic for current governor alpha
  ]

  // get all proposal entities
  const allProposalsByGovContract = [
    useSingleContractMultipleData(
      govContracts[0],
      'proposals',
      proposalsIndicesByGovContract[0].map((i) => [i])
    ),
    useSingleContractMultipleData(
      govContracts[1],
      'proposals',
      proposalsIndicesByGovContract[1].map((i) => [i])
    ),
  ]

  // get all proposal states
  const allProposalStatesByGovContract = [
    useSingleContractMultipleData(
      govContracts[0],
      'state',
      proposalsIndicesByGovContract[0].map((i) => [i])
    ),
    useSingleContractMultipleData(
      govContracts[1],
      'state',
      proposalsIndicesByGovContract[1].map((i) => [i])
    ),
  ]

  // get metadata from past events
  const formattedEventsByGovContract = [useDataFromEventLogs(govContracts[0]), useDataFromEventLogs(govContracts[1])]

  const returnData: ProposalData[][] = []

  for (let governorIndex = 0; governorIndex < allProposalsByGovContract.length; governorIndex++) {
    const allProposals = allProposalsByGovContract[governorIndex]
    const allProposalStates = allProposalStatesByGovContract[governorIndex]
    const formattedEvents = formattedEventsByGovContract[governorIndex]

    if (
      allProposals?.every((p) => Boolean(p.result)) &&
      allProposalStates?.every((p) => Boolean(p.result)) &&
      formattedEvents?.every((p) => Boolean(p))
    ) {
      returnData.push(
        allProposals.map((proposal, i): ProposalData => {
          let description = formattedEvents[i].description
          // overwrite broken description
          if (governorIndex === 0 && i === 2) description = UNISWAP_GRANTS_PROPOSAL_DESCRIPTION

          return {
            id: proposal?.result?.id.toString(),
            title: description?.split(/# |\n/g)[1] ?? 'Untitled',
            description: description ?? 'No description.',
            proposer: proposal?.result?.proposer,
            status: allProposalStates[i]?.result?.[0] ?? ProposalState.Undetermined,
            forCount: parseFloat(ethers.utils.formatUnits(proposal?.result?.forVotes.toString(), 18)),
            againstCount: parseFloat(ethers.utils.formatUnits(proposal?.result?.againstVotes.toString(), 18)),
            startBlock: parseInt(proposal?.result?.startBlock?.toString()),
            endBlock: parseInt(proposal?.result?.endBlock?.toString()),
            details: formattedEvents[i].details,
          }
        })
      )
    } else {
      returnData.push([])
    }
  }

  return returnData
}

export function useProposalData(id: string): ProposalData | undefined {
  // TODO don't hardcode for first gov alpha
  const allProposalData = useAllProposalData()[0]
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

  // we only care about voting on the active governance contract
  const govContracts = useGovernanceContracts()
  const govContract = govContracts[govContracts.length - 1]

  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !govContract || !proposalId) return
      const args = [proposalId, support]
      return govContract.estimateGas.castVote(...args, {}).then((estimatedGasLimit) => {
        return govContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, govContract]
  )
  return { voteCallback }
}
