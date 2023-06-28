import { Address } from '@celo/contractkit'
import { useCelo } from '@celo/react-celo'
import { BigNumber } from 'ethers'
import { TypedEvent } from 'generated/common'
import { useRomulusDelegateContract } from 'hooks/useContract'
import { useCallback, useEffect, useRef, useState } from 'react'

type VoteMap = {
  [proposalId: string]: TypedEvent<
    [string, BigNumber, number, BigNumber, string] & {
      voter: string
      proposalId: BigNumber
      support: number
      votes: BigNumber
      reason: string
    }
  >
}

export const useVoteCasts = (romulusAddress: Address) => {
  const { address } = useCelo()
  const mountRef = useRef(true)
  const romulusContract = useRomulusDelegateContract(romulusAddress)
  const [voteEvents, setVoteEvents] = useState<VoteMap | undefined>(undefined)

  const call = useCallback(async () => {
    if (!romulusContract || !mountRef.current) {
      setVoteEvents(undefined)
      return
    }
    const filter = romulusContract.filters.VoteCast(address, null, null, null, null)
    const voteEvents = await romulusContract.queryFilter(filter)
    setVoteEvents(
      voteEvents.reduce((acc, event) => {
        acc[event.args.proposalId.toString()] = event
        return acc
      }, {} as VoteMap)
    )
  }, [address, romulusContract])

  useEffect(() => {
    call()
  }, [call])

  useEffect(() => {
    return () => {
      mountRef.current = false
    }
  }, [])
  return voteEvents
}
