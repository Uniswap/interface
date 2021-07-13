import { TransactionResponse } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNISWAP_GRANTS_PROPOSAL_DESCRIPTION } from 'constants/proposals/uniswap_grants_proposal_description'
import { Contract } from 'ethers'
import { defaultAbiCoder, formatUnits, Interface, isAddress } from 'ethers/lib/utils'
import {
  useGovernanceV0Contract,
  useGovernanceV1Contract,
  useLatestGovernanceContract,
  useUniContract,
} from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useMemo } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { SupportedChainId } from '../../constants/chains'
import { UNISWAP_GRANTS_START_BLOCK } from '../../constants/proposals'
import { UNI } from '../../constants/tokens'
import { useLogs } from '../logs/hooks'
import { useSingleCallResult, useSingleContractMultipleData } from '../multicall/hooks'
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
  UNDETERMINED = -1,
  PENDING,
  ACTIVE,
  CANCELED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED,
}

const GovernanceInterface = new Interface(GOV_ABI)

// get count of all proposals made in the latest governor contract
function useProposalCount(contract: Contract | null): number | undefined {
  const { result } = useSingleCallResult(contract, 'proposalCount')

  return result?.[0]?.toNumber()
}

interface FormattedProposalLog {
  description: string
  details: { target: string; functionSig: string; callData: string }[]
}
/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
function useFormattedProposalCreatedLogs(contract: Contract | null): FormattedProposalLog[] | undefined {
  // create filters for ProposalCreated events
  const filter = useMemo(() => contract?.filters?.ProposalCreated(), [contract])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs?.map((log) => {
      const parsed = GovernanceInterface.parseLog(log).args
      return {
        description: parsed.description,
        details: parsed.targets.map((target: string, i: number) => {
          const signature = parsed.signatures[i]
          const [name, types] = signature.substr(0, signature.length - 1).split('(')
          const calldata = parsed.calldatas[i]
          const decoded = defaultAbiCoder.decode(types.split(','), calldata)
          return {
            target,
            functionSig: name,
            callData: decoded.join(', '),
          }
        }),
      }
    })
  }, [useLogsResult])
}

const V0_PROPOSAL_IDS = [[1], [2], [3], [4]]

function countToIndices(count: number | undefined) {
  return typeof count === 'number' ? new Array(count).fill(0).map((_, i) => [i + 1]) : []
}

// get data for all past and active proposals
export function useAllProposalData(): { data: ProposalData[]; loading: boolean } {
  const { chainId } = useActiveWeb3React()
  const gov0 = useGovernanceV0Contract()
  const gov1 = useGovernanceV1Contract()

  const proposalCount0 = useProposalCount(gov0)
  const proposalCount1 = useProposalCount(gov1)

  const gov0ProposalIndexes = useMemo(() => {
    return chainId === SupportedChainId.MAINNET ? V0_PROPOSAL_IDS : countToIndices(proposalCount0)
  }, [chainId, proposalCount0])
  const gov1ProposalIndexes = useMemo(() => {
    return countToIndices(proposalCount1)
  }, [proposalCount1])

  const proposalsV0 = useSingleContractMultipleData(gov0, 'proposals', gov0ProposalIndexes)
  const proposalsV1 = useSingleContractMultipleData(gov1, 'proposals', gov1ProposalIndexes)

  // get all proposal states
  const proposalStatesV0 = useSingleContractMultipleData(gov0, 'state', gov0ProposalIndexes)
  const proposalStatesV1 = useSingleContractMultipleData(gov1, 'state', gov1ProposalIndexes)

  // get metadata from past events
  const formattedLogsV0 = useFormattedProposalCreatedLogs(gov0)
  const formattedLogsV1 = useFormattedProposalCreatedLogs(gov1)

  // early return until events are fetched
  return useMemo(() => {
    const proposalsCallData = proposalsV0.concat(proposalsV1)
    const proposalStatesCallData = proposalStatesV0.concat(proposalStatesV1)
    const formattedLogs = (formattedLogsV0 ?? []).concat(formattedLogsV1 ?? [])

    if (
      proposalsCallData.some((p) => p.loading) ||
      proposalStatesCallData.some((p) => p.loading) ||
      (gov0 && !formattedLogsV0) ||
      (gov1 && !formattedLogsV1)
    ) {
      return { data: [], loading: true }
    }

    return {
      data: proposalsCallData.map((proposal, i) => {
        let description = formattedLogs[i]?.description
        const startBlock = parseInt(proposal?.result?.startBlock?.toString())
        if (startBlock === UNISWAP_GRANTS_START_BLOCK) {
          description = UNISWAP_GRANTS_PROPOSAL_DESCRIPTION
        }
        return {
          id: proposal?.result?.id.toString(),
          title: description?.split(/# |\n/g)[1] ?? t`Untitled`,
          description: description ?? t`No description.`,
          proposer: proposal?.result?.proposer,
          status: proposalStatesCallData[i]?.result?.[0] ?? ProposalState.UNDETERMINED,
          forCount: parseFloat(formatUnits(proposal?.result?.forVotes?.toString() ?? 0, 18)),
          againstCount: parseFloat(formatUnits(proposal?.result?.againstVotes?.toString() ?? 0, 18)),
          startBlock,
          endBlock: parseInt(proposal?.result?.endBlock?.toString()),
          details: formattedLogs[i]?.details,
          governorIndex: i >= gov0ProposalIndexes.length ? 1 : 0,
        }
      }),
      loading: false,
    }
  }, [
    formattedLogsV0,
    formattedLogsV1,
    gov0,
    gov0ProposalIndexes.length,
    gov1,
    proposalStatesV0,
    proposalStatesV1,
    proposalsV0,
    proposalsV1,
  ])
}

export function useProposalData(governorIndex: number, id: string): ProposalData | undefined {
  const { data } = useAllProposalData()
  return data.filter((p) => p.governorIndex === governorIndex)?.find((p) => p.id === id)
}

// get the users delegatee if it exists
export function useUserDelegatee(): string {
  const { account } = useActiveWeb3React()
  const uniContract = useUniContract()
  const { result } = useSingleCallResult(uniContract, 'delegates', [account ?? undefined])
  return result?.[0] ?? undefined
}

// gets the users current votes
export function useUserVotes(): { loading: boolean; votes: CurrencyAmount<Token> | undefined } {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const { result, loading } = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])
  return useMemo(() => {
    const uni = chainId ? UNI[chainId] : undefined
    return { loading, votes: uni && result ? CurrencyAmount.fromRawAmount(uni, result?.[0]) : undefined }
  }, [chainId, loading, result])
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
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(chainId, estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: t`Delegated votes`,
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
  const { account, chainId } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()

  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !latestGovernanceContract || !proposalId || !chainId) return
      const args = [proposalId, support]
      return latestGovernanceContract.estimateGas.castVote(...args, {}).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(chainId, estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract, chainId]
  )
  return { voteCallback }
}

export function useCreateProposalCallback(): (
  createProposalData: CreateProposalData | undefined
) => undefined | Promise<string> {
  const { account, chainId } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (createProposalData: CreateProposalData | undefined) => {
      if (!account || !latestGovernanceContract || !createProposalData || !chainId) return undefined

      const args = [
        createProposalData.targets,
        createProposalData.values,
        createProposalData.signatures,
        createProposalData.calldatas,
        createProposalData.description,
      ]

      return latestGovernanceContract.estimateGas.propose(...args).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .propose(...args, { gasLimit: calculateGasMargin(chainId, estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: t`Submitted new proposal`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract, chainId]
  )
}

export function useLatestProposalId(address: string | undefined): string | undefined {
  const govContractV1 = useGovernanceV1Contract()
  const res = useSingleCallResult(govContractV1, 'latestProposalIds', [address])

  return res?.result?.[0]?.toString()
}

export function useProposalThreshold(): CurrencyAmount<Token> | undefined {
  const { chainId } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  const res = useSingleCallResult(latestGovernanceContract, 'proposalThreshold')
  const uni = chainId ? UNI[chainId] : undefined

  if (res?.result?.[0] && uni) {
    return CurrencyAmount.fromRawAmount(uni, res.result[0])
  }

  return undefined
}
