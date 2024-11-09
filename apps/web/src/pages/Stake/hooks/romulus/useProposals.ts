import { BigNumber } from '@ethersproject/bignumber'
import { useRomulusDelegateContract } from 'hooks/useContract'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TypedEvent } from 'uniswap/src/abis/types/common'
import fetchEvents from 'utils/fetchEvents'
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
    const filter = romulusContract.filters.ProposalCreated(null, null, null, null, null, null, null, null, null)
    const proposalEvents1 = await fetchEvents<TypedEvent<Proposal>>(romulusContract, filter, -18000, -12000)
    const proposalEvents2 = await fetchEvents<TypedEvent<Proposal>>(romulusContract, filter, -12000, -6000)
    const proposalEvents3 = await fetchEvents<TypedEvent<Proposal>>(romulusContract, filter, -6000, -1)
    console.log(proposalEvents1.concat(proposalEvents2).concat(proposalEvents3))
    setProposals(
      (cachedProposalEvents as unknown as TypedEvent<Proposal>[]).concat(
        proposalEvents1.concat(proposalEvents2).concat(proposalEvents3)
      )
    )
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
