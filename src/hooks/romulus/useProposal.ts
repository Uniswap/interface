import { Address } from '@celo/contractkit'
import { BigNumber } from 'ethers'
import { useRomulusDelegateContract } from 'hooks/useContract'
import { useCallback, useEffect, useRef, useState } from 'react'

export enum Support {
  AGAINST = 0,
  FOR = 1,
  ABSTAIN = 2,
}

export enum ProposalState {
  PENDING = 0,
  ACTIVE,
  CANCELED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED,
}

type Proposal = [
  BigNumber,
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  boolean,
  boolean
] & {
  id: BigNumber
  proposer: string
  eta: BigNumber
  startBlock: BigNumber
  endBlock: BigNumber
  forVotes: BigNumber
  againstVotes: BigNumber
  abstainVotes: BigNumber
  canceled: boolean
  executed: boolean
}

export const useProposal = (romulusAddress: Address, proposalId: BigNumber) => {
  const mountRef = useRef(true)
  const romulusContract = useRomulusDelegateContract(romulusAddress)
  const [proposal, setProposal] = useState<Proposal | undefined>(undefined)
  const [proposalState, setproposalState] = useState<ProposalState>(ProposalState.CANCELED)
  const call = useCallback(async () => {
    if (!romulusContract || !mountRef.current) return
    const proposalData = await romulusContract.proposals(proposalId)
    const proposalStateData = await romulusContract.state(proposalId)
    setProposal(proposalData)
    setproposalState(proposalStateData)
  }, [romulusContract, proposalId])

  useEffect(() => {
    call()
  }, [call])

  useEffect(() => {
    return () => {
      mountRef.current = false
    }
  }, [])

  return { proposal, proposalState }
}
