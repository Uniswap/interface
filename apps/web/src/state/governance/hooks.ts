import { defaultAbiCoder, Interface } from '@ethersproject/abi'
import { isAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import type { TransactionResponse } from '@ethersproject/providers'
// eslint-disable-next-line no-restricted-imports
//import GovernorAlphaJSON from '@uniswap/governance/build/GovernorAlpha.json'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { GOVERNANCE_PROXY_ADDRESSES, RB_REGISTRY_ADDRESSES, STAKING_PROXY_ADDRESSES } from 'constants/addresses'
import { LATEST_GOVERNOR_INDEX } from 'constants/governance'
import { ZERO_ADDRESS } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useContract } from 'hooks/useContract'
import { useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useCallback, useMemo } from 'react'
import { VoteOption } from 'state/governance/types'
import { useLogs } from 'state/logs/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import GOVERNANCE_RB_ABI from 'uniswap/src/abis/governance.json'
//import GOVERNOR_BRAVO_ABI from 'uniswap/src/abis/governor-bravo.json'
import POOL_EXTENDED_ABI from 'uniswap/src/abis/pool-extended.json'
import RB_REGISTRY_ABI from 'uniswap/src/abis/rb-registry.json'
import STAKING_ABI from 'uniswap/src/abis/staking-impl.json'
import STAKING_PROXY_ABI from 'uniswap/src/abis/staking-proxy.json'
import { GRG } from 'uniswap/src/constants/tokens'
import { t } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { calculateGasMargin } from 'utils/calculateGasMargin'

function useGovernanceProxyContract(): Contract | null {
  const { chainId } = useAccount()
  return useContract(
    chainId ? GOVERNANCE_PROXY_ADDRESSES[chainId] : undefined,
    GOVERNANCE_RB_ABI,
    true,
  )
}

function useRegistryContract(): Contract | null {
  const { chainId } = useAccount()
  return useContract(
    chainId ? RB_REGISTRY_ADDRESSES[chainId] : undefined,
    RB_REGISTRY_ABI,
    true,
  )
}

export function useStakingContract(): Contract | null {
  const { chainId } = useAccount()
  return useContract(
    chainId ? STAKING_PROXY_ADDRESSES[chainId] : undefined,
    STAKING_ABI,
    true,
  )
}

export function useStakingProxyContract(): Contract | null {
  const { chainId } = useAccount()
  return useContract(
    chainId ? STAKING_PROXY_ADDRESSES[chainId] : undefined,
    STAKING_PROXY_ABI,
    true,
  )
}

export function usePoolExtendedContract(poolAddress: string | undefined): Contract | null {
  return useContract(poolAddress, POOL_EXTENDED_ABI, true)
}

// TODO: update structs interfaces
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
  forCount: CurrencyAmount<Token>
  againstCount: CurrencyAmount<Token>
  startBlock: number
  endBlock: number
  eta: BigNumber
  details: ProposalDetail[]
  governorIndex: number // index in the governance address array for which this proposal pertains
}

interface ProposedAction {
  target: string
  data: string
  value: number
}

export interface CreateProposalData {
  actions: ProposedAction[]
  description: string
}

export enum StakeStatus {
  UNDELEGATED,
  DELEGATED,
}

interface StakeInfo {
  status: StakeStatus
  poolId: string
}

export interface StakeData {
  amount: string
  pool: string | null
  fromPoolId?: string
  poolId: string
  poolContract?: Contract | null
  stakingPoolExists?: boolean
  isPoolMoving?: boolean
}

export enum ProposalState {
  UNDETERMINED = -1,
  PENDING,
  ACTIVE,
  CANCELED,
  QUALIFIED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED,
}

const GovernanceInterface = new Interface(GOVERNANCE_RB_ABI)

// get count of all proposals made in the latest governor contract
function useProposalCount(contract: Contract | null): number | undefined {
  const { result } = useSingleCallResult(contract, 'proposalCount')

  return result?.[0]?.toNumber()
}

interface FormattedProposalLog {
  description: string
  actions: ProposedAction[]
  proposer: string
  proposalId: number
  startBlockOrTime: number
  endBlockOrTime: number
}

const FOUR_BYTES_DIR: { [sig: string]: string } = {
  '0x5ef2c7f0': 'setSubnodeRecord(bytes32,bytes32,address,address,uint64)',
  '0x10f13a8c': 'setText(bytes32,string,string)',
  '0xb4720477': 'sendMessageToChild(address,bytes)',
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x7b1837de': 'fund(address,uint256)',
  '0x332f6465': 'setAdapter(address,bool)',
  '0xd784d426': 'setImplementation(address)',
  '0x83f94db7': 'upgradeImplementation(address)',
  '0x42f1181e': 'addAuthorizedAddress(address)',
  '0x37b006a6': 'detachStakingContract',
  '0x66615d56': 'attachStakingContract(address)',
  '0x70712939': 'removeAuthorizedAddress(address)',
  '0xf2fde38b': 'transferOwnership(address)',
  '0xc14b8e9c': 'updateThresholds(uint256,uin256)',
  '0x3f4350a5': 'upgradeStrategy(address)',
  '0xa91ee0dc': 'setRegistry(address)',
  '0x7a9e5e4b': 'setAuthority(address)',
  '0xb516e6e1': 'setRigoblockDao(address)',
  '0xc91b0149': 'setWhitelister(address,bool)',
  '0x13af4035': 'setOwner(address)',
  '0x71013c10': 'setFactory(address)',
  '0xcd29d473': 'addMethod(bytes4,address)',
  '0xd9efcc1e': 'removeMethod(bytes4,address)',
}

/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
function useFormattedProposalCreatedLogs(
  contract: Contract | null,
  indices: number[][],
  fromBlock?: number,
  toBlock?: number,
): FormattedProposalLog[] | undefined {
  // create filters for ProposalCreated events
  const filter = useMemo(() => {
    const filter = contract?.filters?.ProposalCreated()
    if (!filter) {
      return undefined
    }
    return {
      ...filter,
      fromBlock,
      toBlock,
    }
  }, [contract, fromBlock, toBlock])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs
      ?.map((log: { topics: string[], data: string }) => {
        const parsed = GovernanceInterface.parseLog(log).args
        return parsed
      })
      ?.filter((parsed: any) => indices.flat().some((i) => i === parsed.proposalId))
      ?.map((parsed: any) => {
        const description: string = parsed.description
        const proposer = parsed.proposer.toString()
        const proposalId = parsed.proposalId

        return {
          proposer,
          description,
          proposalId,
          startBlockOrTime: parseInt(parsed.startBlockOrTime?.toString()),
          endBlockOrTime: parseInt(parsed.startBlockOrTime?.toString()),
          actions: parsed.actions,
          details: parsed.actions.map((action: ProposedAction) => {
            let calldata = action.data

            const fourbyte = calldata.slice(0, 10)
            const sig = FOUR_BYTES_DIR[fourbyte] ?? 'UNKNOWN()'
            if (!sig) {
              throw new Error('Missing four byte sig')
            }
            const [name, types] = sig.substring(0, sig.length - 1).split('(')
            calldata = `0x${calldata.slice(10)}`

            const decoded = defaultAbiCoder.decode(types.split(','), calldata)
            return {
              target: action.target,
              functionSig: name,
              callData: decoded.join(', '),
            }
          }),
        }
      })
  }, [indices, useLogsResult])
}

function countToIndices(count: number | undefined, skip = 0) {
  return typeof count === 'number' ? new Array(count - skip).fill(0).map((_, i) => [i + 1 + skip]) : []
}

// get data for all past and active proposals
export function useAllProposalData(): { data: ProposalData[]; loading: boolean } {
  const { chainId } = useAccount()
  const blockNumber = useBlockNumber()
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

  // TODO: deploy on Sepolia
  if (chainId === UniverseChainId.Mainnet) {
    govStartBlock = 16620590
  } else if (chainId === UniverseChainId.Sepolia) {
    govStartBlock = 6921639
  } else if (chainId === UniverseChainId.ArbitrumOne) {
    govStartBlock = 60590354
  } else if (chainId === UniverseChainId.Optimism) {
    govStartBlock = 74115128
  } else if (chainId === UniverseChainId.Polygon) {
    govStartBlock = 39249858
  } else if (chainId === UniverseChainId.Base) {
    // quicknode returns only a very limited number of logs, therefore we won't see proposal details
    govStartBlock = typeof blockNumber === 'number' ? blockNumber - 4000 : blockNumber //2570523
  } else if (chainId === UniverseChainId.Bnb) {
    // since bsc enpoints will return an end on historical logs, we try to get proposal logs in the last 40k blocks
    govStartBlock = typeof blockNumber === 'number' ? blockNumber - 4000 : blockNumber //29095808
  }

  const formattedLogsV1 = useFormattedProposalCreatedLogs(gov, govProposalIndexes, govStartBlock)

  // TODO: we must use staked GRG instead
  const grg = useMemo(() => (chainId ? GRG[chainId] : undefined), [chainId])

  // early return until events are fetched
  return useMemo(() => {
    const proposalsCallData = [...proposals]
    const proposalStatesCallData = [...proposalStates]
    // TODO: check what we are doing wrong here
    const formattedLogs = [...(formattedLogsV1 ?? [])]

    if (
      !grg ||
      proposalsCallData.some((p) => p.loading) ||
      proposalStatesCallData.some((p) => p.loading) ||
      (gov && !formattedLogs)
    ) {
      return { data: [], loading: true }
    }

    // TODO: remove unnecessary code
    return {
      data: proposalsCallData.map((proposal, i) => {
        const startBlock = parseInt(proposal?.result?.proposalWrapper?.proposal?.startBlockOrTime?.toString())

        const description = formattedLogs[i]?.description ?? ''
        const title = description?.split(/#+\s|\n/g)[1]

        const details = proposal?.result?.proposalWrapper?.proposedAction.map((action: ProposedAction) => {
          let calldata = action.data

          const fourbyte = calldata.slice(0, 10)
          const sig = FOUR_BYTES_DIR[fourbyte] ?? 'UNKNOWN()'
          if (!sig) {
            throw new Error('Missing four byte sig')
          }
          const [name, types] = sig.substring(0, sig.length - 1).split('(')
          calldata = `0x${calldata.slice(10)}`

          const decoded = types ? defaultAbiCoder.decode(types.split(','), calldata) : []
          return {
            target: action.target,
            functionSig: name,
            callData: decoded.join(', '),
          }
        })

        // TODO: amend block to time
        return {
          id: (i + 1).toString(), //formattedLogs[i]?.proposalId?.toString(),
          title: title ?? t('common.untitled'),
          description: description ?? t('common.noDescription'),
          proposer: formattedLogs[i]?.proposer, //proposal?.result?.proposer,
          status: proposalStatesCallData[i]?.result?.[0] ?? ProposalState.UNDETERMINED,
          forCount: CurrencyAmount.fromRawAmount(grg, proposal?.result?.proposalWrapper?.proposal?.votesFor),
          againstCount: CurrencyAmount.fromRawAmount(grg, proposal?.result?.proposalWrapper?.proposal?.votesAgainst),
          startBlock,
          endBlock: parseInt(proposal?.result?.proposalWrapper?.proposal?.endBlockOrTime?.toString()),
          eta: BigNumber.from(0), //proposal?.result?.eta,
          details, //: formattedLogs[i]?.details,
          governorIndex: 1,
        }
      }),
      loading: false,
    }
  }, [formattedLogsV1, gov, proposalStates, proposals, grg])
}

export function useProposalData(governorIndex: number, id: string): ProposalData | undefined {
  const { data } = useAllProposalData()
  return data.filter((p) => p.governorIndex === governorIndex)?.find((p) => p.id === id)
}

export function useQuorum(governorIndex: number): CurrencyAmount<Token> | undefined {
  const latestGovernanceContract = useGovernanceProxyContract()
  const govParams = useSingleCallResult(latestGovernanceContract, 'governanceParameters')?.result?.[0]
  const quorumVotes = govParams?.params?.quorumThreshold
  const { chainId } = useAccount()
  const grg = useMemo(() => (chainId ? GRG[chainId] : undefined), [chainId])

  if (
    !latestGovernanceContract ||
    !quorumVotes ||
    //chainId !== UniverseChainId.Mainnet ||
    !grg ||
    governorIndex !== LATEST_GOVERNOR_INDEX
  ) {
    return undefined
  }

  return CurrencyAmount.fromRawAmount(grg, quorumVotes)
}

// gets the users current votes
export function useUserVotes(): { loading: boolean; votes?: CurrencyAmount<Token> } {
  const account = useAccount()
  const governance = useGovernanceProxyContract()

  // check for available votes
  const { result, loading } = useSingleCallResult(governance, 'getVotingPower', [account.address])
  return useMemo(() => {
    const grg = account.chainId ? GRG[account.chainId] : undefined
    return { loading, votes: grg && result ? CurrencyAmount.fromRawAmount(grg, result?.[0]) : undefined }
  }, [account.chainId, loading, result])
}

export function usePoolIdByAddress(pool: string | undefined): {
  poolId?: string
  stakingPoolExists: boolean
} {
  const registryContract = useRegistryContract()
  const poolId = useSingleCallResult(registryContract ?? undefined, 'getPoolIdFromAddress', [pool ?? undefined])
    ?.result?.[0]
  const stakingContract = useStakingContract()
  const stakingPool = useSingleCallResult(stakingContract ?? undefined, 'getStakingPool', [poolId])?.result?.[0]
  const stakingPoolExists = stakingPool !== undefined ? stakingPool?.operator !== ZERO_ADDRESS : false
  if (!poolId) {
    return { stakingPoolExists }
  } else {
    return { poolId, stakingPoolExists }
  }
}

export function useStakeBalance(
  poolId: string | null | undefined,
  owner?: string
): CurrencyAmount<Currency> | undefined {
  const account = useAccount()
  const grg = account.chainId ? GRG[account.chainId] : undefined
  const stakingContract = useStakingContract()
  const stake = useSingleCallResult(stakingContract ?? undefined, 'getStakeDelegatedToPoolByOwner', [
    owner ?? account.address,
    poolId ?? undefined,
  ])?.result?.[0]

  return stake && grg ? CurrencyAmount.fromRawAmount(grg, stake.nextEpochBalance) : undefined
}

export function useDelegateCallback(): (stakeData: StakeData | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const { provider } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const stakingContract = useStakingContract()
  const stakingProxy = useStakingProxyContract()

  return useCallback(
    (stakeData: StakeData | undefined) => {
      if (!provider || !account.chainId || !account.address || !stakeData || !isAddress(stakeData.pool ?? '')) {
        return undefined
      }
      //if (!stakeData.amount) return
      const createPoolCall = stakingContract?.interface.encodeFunctionData('createStakingPool', [stakeData.pool])
      const stakeCall = stakingContract?.interface.encodeFunctionData('stake', [stakeData.amount])
      const fromInfo: StakeInfo = { status: StakeStatus.UNDELEGATED, poolId: stakeData.poolId }
      const toInfo: StakeInfo = { status: StakeStatus.DELEGATED, poolId: stakeData.poolId }
      const moveStakeCall = stakingContract?.interface.encodeFunctionData('moveStake', [
        fromInfo,
        toInfo,
        stakeData.amount,
      ])
      const delegatee = stakeData.pool
      if (!delegatee) {
        return undefined
      }
      //const args = [delegatee]
      // if the staking pool does not exist, user creates it and becomes staking pal
      const args = !stakeData.stakingPoolExists
        ? [[createPoolCall, stakeCall, moveStakeCall]]
        : [[stakeCall, moveStakeCall]]
      if (!stakingProxy) {
        throw new Error('No Staking Contract!')
      }
      return stakingProxy.estimateGas.batchExecute(...args, {}).then((estimatedGasLimit) => {
        return stakingProxy
          .batchExecute(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.DELEGATE,
              delegatee,
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, account.chainId, provider, stakingContract, stakingProxy]
  )
}

export function useDelegatePoolCallback(): (stakeData: StakeData | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const provider = useEthersWeb3Provider()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (stakeData: StakeData | undefined) => {
      if (!provider || !account?.chainId || !account.address || !stakeData || !isAddress(stakeData.pool ?? '')) {
        return undefined
      }
      //if (!stakeData.amount) return
      const delegatee = stakeData.pool
      const poolInstance = stakeData.poolContract ?? undefined
      if (!delegatee) {
        return undefined
      }
      //const args = [delegatee]
      // Rigoblock executes move stake inside stake method, in just 1 call
      const args = [stakeData.amount]
      if (!poolInstance) {
        throw new Error('No Pool Contract!')
      }
      return poolInstance.estimateGas.stake(...args, {}).then((estimatedGasLimit) => {
        return poolInstance
          .stake(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.DELEGATE,
              delegatee,
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, account.chainId, provider],
  )
}

export function useMoveStakeCallback(): (stakeData: StakeData | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const { provider } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const stakingContract = useStakingContract()
  const stakingProxy = useStakingProxyContract()

  return useCallback(
    (stakeData: StakeData | undefined) => {
      if (
        !provider ||
        !account.chainId ||
        !account.address ||
        !stakeData ||
        !stakeData.fromPoolId ||
        !isAddress(stakeData.pool ?? '')
      ) {
        return undefined
      }
      //if (!stakeData.amount) return
      const createPoolCall = stakingContract?.interface.encodeFunctionData('createStakingPool', [stakeData.pool])
      // until a staking implementation upgrade, moving delegated stake requires batching from pool deactivation
      //  and to pool activation
      const deactivateFromInfo: StakeInfo = { status: StakeStatus.DELEGATED, poolId: stakeData.fromPoolId }
      const deactivateToInfo: StakeInfo = { status: StakeStatus.UNDELEGATED, poolId: stakeData.fromPoolId }
      const deactivateCall = stakingContract?.interface.encodeFunctionData('moveStake', [
        deactivateFromInfo,
        deactivateToInfo,
        stakeData.amount,
      ])
      const activateFromInfo: StakeInfo = { status: StakeStatus.UNDELEGATED, poolId: stakeData.poolId }
      const activateToInfo: StakeInfo = { status: StakeStatus.DELEGATED, poolId: stakeData.poolId }
      const activateCall = stakingContract?.interface.encodeFunctionData('moveStake', [
        activateFromInfo,
        activateToInfo,
        stakeData.amount,
      ])
      const delegatee = stakeData.pool
      if (!delegatee) {
        return undefined
      }
      //const args = [delegatee]
      // if the staking pool does not exist, user creates it and becomes staking pal
      const args = !stakeData.stakingPoolExists
        ? stakeData.fromPoolId !== stakeData.poolId
          ? [[createPoolCall, deactivateCall, activateCall]]
          : [[createPoolCall, activateCall]]
        : stakeData.fromPoolId !== stakeData.poolId
        ? [[deactivateCall, activateCall]]
        : [[activateCall]]
      if (!stakingProxy) {
        throw new Error('No Staking Contract!')
      }
      return stakingProxy.estimateGas.batchExecute(...args, {}).then((estimatedGasLimit) => {
        return stakingProxy
          .batchExecute(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.DELEGATE,
              delegatee,
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, account.chainId, provider, stakingContract, stakingProxy]
  )
}

export function useDeactivateStakeCallback(): (stakeData: StakeData | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const { provider } = useWeb3React()
  const addTransaction = useTransactionAdder()
  const stakingContract = useStakingContract()
  const stakingProxy = useStakingProxyContract()

  return useCallback(
    (stakeData: StakeData | undefined) => {
      if (!provider || !account.chainId || !account.address || !stakeData || !isAddress(stakeData.pool ?? '')) {
        return undefined
      }
      const deactivateFromInfo: StakeInfo = { status: StakeStatus.DELEGATED, poolId: stakeData.poolId }
      const deactivateToInfo: StakeInfo = { status: StakeStatus.UNDELEGATED, poolId: stakeData.poolId }
      //if (!stakeData.amount) return
      // in unstake, we use the same StakeData struct but use stakeData.poolId instead of stakeData.fromPoolId
      const deactivateCall = stakingContract?.interface.encodeFunctionData('moveStake', [
        deactivateFromInfo,
        deactivateToInfo,
        stakeData.amount,
      ])

      const delegatee = stakeData.pool
      const poolInstance = stakeData.poolContract ?? undefined
      if (!delegatee) {
        return undefined
      }
      // Rigoblock executes move stake inside stake method, in just 1 call
      const args = stakeData.isPoolMoving ? [stakeData.amount] : [[deactivateCall]]
      if (!stakingProxy) {
        throw new Error('No Staking Contract!')
      }
      if (stakeData.isPoolMoving && !poolInstance) {
        throw new Error('No Pool Contract!')
      }
      if (stakeData.isPoolMoving && poolInstance) {
        return poolInstance.estimateGas.undelegateStake(...args, {}).then((estimatedGasLimit) => {
          return poolInstance
            .undelegateStake(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
            .then((response: TransactionResponse) => {
              // TODO: add more transaction types in store
              addTransaction(response, {
                type: TransactionType.DELEGATE,
                delegatee,
              })
              return response.hash
            })
        })
      }
      return stakingProxy.estimateGas.batchExecute(...args, {}).then((estimatedGasLimit) => {
        return stakingProxy
          .batchExecute(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.DELEGATE,
              delegatee,
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, account.chainId, provider, stakingContract, stakingProxy]
  )
}

export function useVoteCallback(): (
  proposalId: string | undefined,
  voteOption: VoteOption,
) => undefined | Promise<string> {
  const account = useAccount()
  const latestGovernanceContract = useGovernanceProxyContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined, voteOption: VoteOption) => {
      if (!account.address || !latestGovernanceContract || !proposalId || !account.chainId) {
        return undefined
      }
      const args = [proposalId, voteOption === VoteOption.For ? 0 : voteOption === VoteOption.Against ? 1 : 2]
      return latestGovernanceContract.estimateGas.castVote(...args, {}).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.VOTE,
              decision: voteOption,
              governorAddress: latestGovernanceContract.address,
              proposalId: parseInt(proposalId),
              reason: '',
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, latestGovernanceContract, account.chainId],
  )
}

export function useQueueCallback(): (proposalId: string | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const latestGovernanceContract = useGovernanceProxyContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined) => {
      if (!account.address || !latestGovernanceContract || !proposalId || !account.chainId) {
        return undefined
      }
      const args = [proposalId]
      return latestGovernanceContract.estimateGas.queue(...args, {}).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .queue(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.QUEUE,
              governorAddress: latestGovernanceContract.address,
              proposalId: parseInt(proposalId),
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, latestGovernanceContract, account.chainId],
  )
}

export function useExecuteCallback(): (proposalId: string | undefined) => undefined | Promise<string> {
  const account = useAccount()
  const latestGovernanceContract = useGovernanceProxyContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (proposalId: string | undefined) => {
      if (!account.address || !latestGovernanceContract || !proposalId || !account.chainId) {
        return undefined
      }
      const args = [proposalId]
      return latestGovernanceContract.estimateGas.execute(...args, {}).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .execute(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.EXECUTE,
              governorAddress: latestGovernanceContract.address,
              proposalId: parseInt(proposalId),
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, latestGovernanceContract, account.chainId],
  )
}

export function useCreateProposalCallback(): (
  createProposalData: CreateProposalData | undefined,
) => undefined | Promise<string> {
  const account = useAccount()
  const latestGovernanceContract = useGovernanceProxyContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (createProposalData: CreateProposalData | undefined) => {
      if (!account.address || !latestGovernanceContract || !createProposalData || !account.chainId) {
        return undefined
      }

      const args = [
        createProposalData.actions,
        //createProposalData.values,
        //createProposalData.signatures,
        //createProposalData.calldatas,
        createProposalData.description,
      ]

      return latestGovernanceContract.estimateGas.propose(...args).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .propose(...args, { gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              type: TransactionType.SUBMIT_PROPOSAL,
            })
            return response.hash
          })
      })
    },
    [account.address, addTransaction, latestGovernanceContract, account.chainId],
  )
}

//export function useLatestProposalId(address: string | undefined): string | undefined {
//  const latestGovernanceContract = useGovernanceProxyContract()
//  const res = useSingleCallResult(latestGovernanceContract, 'latestProposalIds', [address])
//  return res?.result?.[0]?.toString()
//}

export function useProposalThreshold(): CurrencyAmount<Token> | undefined {
  const { chainId } = useAccount()

  const latestGovernanceContract = useGovernanceProxyContract()
  const res = useSingleCallResult(latestGovernanceContract, 'governanceParameters')
  const grg = useMemo(() => (chainId ? GRG[chainId] : undefined), [chainId])

  if (res?.result?.[0].params?.quorumThreshold && grg) {
    return CurrencyAmount.fromRawAmount(grg, res.result[0].params.proposalThreshold)
  }

  return undefined
}
