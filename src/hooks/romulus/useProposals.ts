import { useContractKit } from '@celo-tools/use-contractkit'
import { BigNumber } from 'ethers'
import { TypedEvent } from 'generated/common'
import { useRomulusDelegateContract } from 'hooks/useContract'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ubeGovernanceAddresses } from '../../constants'

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
  const { network } = useContractKit()
  const romulusAddress = ubeGovernanceAddresses[network.chainId]
  const romulusContract = useRomulusDelegateContract(romulusAddress)
  const [proposals, setProposals] = useState<Array<TypedEvent<Proposal>> | undefined>(undefined)
  const mountRef = useRef(true)

  const call = useCallback(async () => {
    if (!romulusAddress || !romulusContract || !mountRef.current) return
    const filter = romulusContract.filters.ProposalCreated(null, null, null, null, null, null, null, null, null)
    const proposalEvents = await romulusContract.queryFilter(filter)
    setProposals(proposalEvents)
  }, [romulusContract, romulusAddress])

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
