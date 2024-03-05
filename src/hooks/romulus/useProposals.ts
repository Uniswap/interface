import { useCelo } from '@celo/react-celo'
import { ChainId } from '@ubeswap/sdk'
import { BigNumber, ethers } from 'ethers'
import { TypedEvent } from 'generated/common'
import { useRomulusDelegateContract } from 'hooks/useContract'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ubeGovernanceAddresses } from '../../constants'
import { cachedStakeEvents } from './cachedStakeEvents'

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
  const { network } = useCelo()
  const romulusAddress = ubeGovernanceAddresses[network.chainId as ChainId]
  const romulusContract = useRomulusDelegateContract(romulusAddress)
  const [proposals, setProposals] = useState<Array<TypedEvent<Proposal>> | undefined>(undefined)
  const mountRef = useRef(true)

  const call = useCallback(async () => {
    if (!romulusAddress || !romulusContract || !mountRef.current) return
    // const filter = romulusContract.filters.ProposalCreated(null, null, null, null, null, null, null, null, null)
    // const proposalEvents = await fetchEvents<TypedEvent<Proposal>>(romulusContract, filter)
    console.log(cachedStakeEvents)
    setProposals(
      cachedStakeEvents.map(
        (a) =>
          ({
            blockNumber: a.blockNumber,
            blockHash: a.blockHash,
            transactionIndex: a.transactionIndex,
            removed: a.removed,
            address: a.address,
            data: '',
            topics: [],
            transactionHash: a.transactionHash,
            logIndex: a.logIndex,
            event: a.event,
            eventSignature: a.signature,
            args: {
              id: ethers.BigNumber.from(a.returnValues.id),
              values: a.returnValues.values,
              targets: a.returnValues.targets,
              endBlock: ethers.BigNumber.from(a.returnValues.endBlock),
              proposer: a.returnValues.proposer,
              calldatas: a.returnValues.calldatas,
              signatures: a.returnValues.signatures,
              startBlock: ethers.BigNumber.from(a.returnValues.startBlock),
              description: a.returnValues.description,
            } as unknown as Proposal,
          } as unknown as TypedEvent<Proposal>)
      )
    )
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
