import { TransactionResponse } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNISWAP_GRANTS_PROPOSAL_DESCRIPTION } from 'constants/proposals/uniswap_grants_proposal_description'
import { Contract } from 'ethers'
import { defaultAbiCoder, formatUnits, Interface, isAddress } from 'ethers/lib/utils'
import request, { gql } from 'graphql-request'
import snapshot from '@snapshot-labs/snapshot.js';
import Web3Provider from 'web3'
import {
  useGovernanceV0Contract,
  useGovernanceV1Contract,
  useLatestGovernanceContract,
  useUniContract,
} from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import React from 'react'
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
  body: string
  choices: string[]
  start: number
  end: number
  snapshot: number
  state: string
  author: string
  space :{
    id: string
    name:string
  }
  votes?: ProposalVote[]
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

const proposal_query = gql`
query Proposals {
  proposals(
    first: 20,
    skip: 0,
    where: {
      space_in: ["kibaworldwide.eth"],
    },
    orderBy: "created",
    orderDirection: desc
  ) {
    id
    title
    body
    choices
    start
    end
    snapshot
    state
    author
    space {
      id
      name
    }
  }
}
`

const proposal_client = `https://hub.snapshot.org/graphql`
export interface ProposalVote {
  id: string
  voter: string
  created: number | string
  choice: number
}
const votes_query = gql`
query Votes ($proposalId: String!) {
  votes (
    where: {
      proposal: $proposalId
    }
  ) {
    id
    voter
    created
    choice
    space {
      id
    }
  }
}`

// get data for all past and active proposals
export function useAllProposalData(): { data: ProposalData[]; loading: boolean } {
  const { chainId } = useActiveWeb3React()
  const [isLoading ,setIsLoading] = React.useState(false)
  const [proposalData, setProposalData] = React.useState<ProposalData[]>()
  React.useEffect(() => {
    const fn = async () => {
      setIsLoading(true)
      try {
      const proposalData = await request(proposal_client, proposal_query);
      if (proposalData) setProposalData(proposalData.proposals)
      setIsLoading(false)
    } catch {
      setIsLoading(false)
    }
    }
    fn()
  }, [])

  React.useEffect(( ) => {
    const fn = async () => {
      if (proposalData && !proposalData.every(a => !!a.votes)) {
        const allProposalData = await Promise.all(proposalData.map(async (p ) => {
            const votesForProposal = await request(proposal_client, votes_query,  { proposalId: p.id});
            if (votesForProposal) return {...p,votes: votesForProposal.votes }
            else return p
        }))
        setProposalData(allProposalData)
      }
    }
    fn();
  }, [proposalData])
  return useMemo(() => {
    if (
     isLoading
    ) {
      return { data: [], loading: true }
    }

    return {
      data: proposalData as any[],
      loading: false,
    }
  }, [
    proposalData,
    isLoading
  ])
}

export function useProposalData(governorIndex: number, id: string): ProposalData | undefined {
  const { data } = useAllProposalData()
  return data && data?.find(a => a.id === id)
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
  const { account, chainId, library } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  
  const addTransaction = useTransactionAdder()
  const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
  const client = new snapshot.Client712(hub);
  const voteCallback = useCallback( 
    async (proposalId: string | undefined, support: boolean) => {
      const args = [proposalId, support]
      if (library?.provider && account && proposalId) {
      const web3 = new Web3Provider(library.provider as any)
      const receipt = await client.vote(library?.provider as unknown as any, account, {
        space: 'kibaworldwide.eth',
        proposal: proposalId,
        type: 'single-choice',
        choice: support ? "For" : "Against",
        metadata: JSON.stringify({})
      });
      console.dir(receipt)
      return receipt as any
    }
    },
    [account, library, chainId]
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
