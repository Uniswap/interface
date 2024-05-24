import { BigNumber } from '@ethersproject/bignumber'
import { useRomulusDelegateContract } from 'hooks/useContract'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TypedEvent } from 'uniswap/src/abis/types/common'
import { cachedProposalEvents } from './cachedStakeEvents'

type Proposal = [BigNumber, string, string[], BigNumber[], string[], string[], BigNumber, BigNumber, string] & {
  id: BigNumber
  proposer: string
  targets: string[]
  values: BigNumber[]
  signatures: string[]
  calldatas: string[]
  startBlock: BigNumber
  endBlock: BigNumber
  description: string
}

export const useProposals = (): Array<TypedEvent<Proposal>> | undefined => {
  const romulusContract = useRomulusDelegateContract()
  const [proposals, setProposals] = useState<Array<TypedEvent<Proposal>> | undefined>(undefined)
  const mountRef = useRef(true)

  const call = useCallback(async () => {
    if (!romulusContract || !mountRef.current) return
    // const filter = romulusContract.filters.ProposalCreated(null, null, null, null, null, null, null, null, null)
    // const proposalEvents = await fetchEvents<TypedEvent<Proposal>>(romulusContract, filter)
    setProposals(cachedProposalEvents as unknown as TypedEvent<Proposal>[])
  }, [romulusContract])

  useEffect(() => {
    call()
  }, [call])

  useEffect(() => {
    return () => {
      mountRef.current = false
    }
  }, [])

  return proposals
}
