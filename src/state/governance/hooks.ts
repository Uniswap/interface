import { TransactionResponse } from '@ethersproject/providers'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { GOVERNANCE_ADDRESSES } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { UNISWAP_GRANTS_PROPOSAL_DESCRIPTION } from 'constants/proposals/uniswap_grants_proposal_description'
import { BigNumber, ethers, utils } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import { useGovernanceContracts, useUniContract } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { UNISWAP_GRANTS_START_BLOCK } from '../../constants/proposals'
import { UNI } from '../../constants/tokens'
import { useMultipleContractMultipleData, useSingleCallResult } from '../multicall/hooks'
import { useTransactionAdder } from '../transactions/hooks'
import { t } from '@lingui/macro'

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
  governorIndex: number // index in the governance address array for which this proposal pertains
}

export interface CreateProposalData {
  targets: string[]
  values: string[]
  signatures: string[]
  calldatas: string[]
  description: string
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
// get count of all proposals made in the latest governor contract
function useLatestProposalCount(): number | undefined {
  const govContracts = useGovernanceContracts()

  const res = useSingleCallResult(govContracts[0], 'proposalCount')

  if (res?.result?.[0]) {
    return (res.result[0] as BigNumber).toNumber()
  }

  return undefined
}

/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
function useDataFromEventLogs():
  | {
      description: string
      details: { target: string; functionSig: string; callData: string }[]
    }[][]
  | undefined {
  const { library, chainId } = useActiveWeb3React()
  const [formattedEvents, setFormattedEvents] =
    useState<{ description: string; details: { target: string; functionSig: string; callData: string }[] }[][]>()

  const govContracts = useGovernanceContracts()

  // create filters for ProposalCreated events
  const filters = useMemo(
    () =>
      govContracts?.filter((govContract) => !!govContract)?.length > 0
        ? govContracts
            .filter((govContract): govContract is ethers.Contract => !!govContract)
            .map((contract) => ({
              ...contract.filters.ProposalCreated(),
              fromBlock: 10861678, // TODO could optimize this on a per-contract basis, this is the safe value
              toBlock: 'latest',
            }))
        : undefined,
    [govContracts]
  )

  // clear logs on chainId change
  useEffect(() => {
    return () => {
      setFormattedEvents(undefined)
    }
  }, [chainId])

  useEffect(() => {
    if (!filters || !library) return
    let stale = false

    if (!formattedEvents) {
      Promise.all(filters.map((filter) => library.getLogs(filter)))
        .then((governanceContractsProposalEvents) => {
          if (stale) return

          const formattedEventData = governanceContractsProposalEvents.map((proposalEvents) => {
            return proposalEvents.map((event) => {
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
          })

          setFormattedEvents(formattedEventData)
        })
        .catch((error) => {
          if (stale) return

          console.error('Failed to fetch proposals', error)
          setFormattedEvents(undefined)
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
export function useAllProposalData(): ProposalData[] {
  const { chainId } = useActiveWeb3React()
  const proposalCount = useLatestProposalCount()

  const addresses = useMemo(() => {
    return chainId === SupportedChainId.MAINNET ? GOVERNANCE_ADDRESSES.map((addressMap) => addressMap[chainId]) : []
  }, [chainId])

  const proposalIndexes = useMemo(() => {
    return chainId === SupportedChainId.MAINNET
      ? [
          typeof proposalCount === 'number' ? new Array(proposalCount).fill(0).map((_, i) => [i + 1]) : [], // dynamic for current governor alpha
          [[1], [2], [3], [4]], // hardcoded for governor alpha V0
        ]
      : []
  }, [chainId, proposalCount])

  // get all proposal entities
  const allProposalsCallData = useMultipleContractMultipleData(
    addresses,
    GovernanceInterface,
    'proposals',
    proposalIndexes
  )

  // get all proposal states
  const allProposalStatesCallData = useMultipleContractMultipleData(
    addresses,
    GovernanceInterface,
    'state',
    proposalIndexes
  )

  // get metadata from past events
  const allFormattedEvents = useDataFromEventLogs()

  // early return until events are fetched
  if (!allFormattedEvents) return []

  const results: ProposalData[][] = []

  for (
    let governanceContractIndex = 0;
    governanceContractIndex < allProposalsCallData.length;
    governanceContractIndex++
  ) {
    const proposalsCallData = allProposalsCallData[governanceContractIndex]
    const proposalStatesCallData = allProposalStatesCallData[governanceContractIndex]
    const formattedEvents = allFormattedEvents[governanceContractIndex]

    if (
      !proposalsCallData?.every((p) => Boolean(p.result)) ||
      !proposalStatesCallData?.every((p) => Boolean(p.result)) ||
      !formattedEvents?.every((p) => Boolean(p))
    ) {
      results.push([])
      continue
    }

    results.push(
      proposalsCallData.map((proposal, i) => {
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
          status: proposalStatesCallData[i]?.result?.[0] ?? ProposalState.Undetermined,
          forCount: parseFloat(ethers.utils.formatUnits(proposal?.result?.forVotes.toString(), 18)),
          againstCount: parseFloat(ethers.utils.formatUnits(proposal?.result?.againstVotes.toString(), 18)),
          startBlock,
          endBlock: parseInt(proposal?.result?.endBlock?.toString()),
          details: formattedEvents[i].details,
          governorIndex: governanceContractIndex,
        }
      })
    )
  }

  return results.reverse().flat()
}

export function useProposalData(governorIndex: number, id: string): ProposalData | undefined {
  const allProposalData = useAllProposalData()
  return allProposalData?.filter((p) => p.governorIndex === governorIndex)?.find((p) => p.id === id)
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

export function useCreateProposalCallback(): (
  createProposalData: CreateProposalData | undefined
) => undefined | Promise<string> {
  const { account } = useActiveWeb3React()

  const govContracts = useGovernanceContracts()
  const latestGovernanceContract = govContracts ? govContracts[0] : null
  const addTransaction = useTransactionAdder()

  const createProposalCallback = useCallback(
    (createProposalData: CreateProposalData | undefined) => {
      if (!account || !latestGovernanceContract || !createProposalData) return undefined

      const args = [
        createProposalData.targets,
        createProposalData.values,
        createProposalData.signatures,
        createProposalData.calldatas,
        createProposalData.description,
      ]

      return latestGovernanceContract.estimateGas.propose(...args).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .propose(...args, { gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: t`Submitted new proposal`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract]
  )

  return createProposalCallback
}

export function useLatestProposalId(address: string): string | undefined {
  const govContracts = useGovernanceContracts()
  const latestGovernanceContract = govContracts ? govContracts[0] : null
  const res = useSingleCallResult(latestGovernanceContract, 'latestProposalIds', [address])

  if (res?.result?.[0]) {
    return (res.result[0] as BigNumber).toString()
  }

  return undefined
}

export function useProposalThreshold(): CurrencyAmount<Token> | undefined {
  const { chainId } = useActiveWeb3React()

  const govContracts = useGovernanceContracts()
  const latestGovernanceContract = govContracts ? govContracts[0] : null
  const res = useSingleCallResult(latestGovernanceContract, 'proposalThreshold')
  const uni = chainId ? UNI[chainId] : undefined

  if (res?.result?.[0] && uni) {
    return CurrencyAmount.fromRawAmount(uni, res.result[0])
  }

  return undefined
}
