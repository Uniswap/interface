import { useEffect, useState } from 'react'
import { ARBITRUM_RINKEBY_PROVIDER } from '../../constants'
import { useClaimTxConfirmed } from '../../state/claim/hooks'
import { useSWPRClaimerContract } from '../useContract'

export default function useHasClaimed(account: string | null | undefined): { loading: boolean; claimed: boolean } {
  const swprClaimerContract = useSWPRClaimerContract()
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [latestBlockNumber, setLatestBlockNumber] = useState(0)
  const claimTxConfirmed = useClaimTxConfirmed()

  useEffect(() => {
    ARBITRUM_RINKEBY_PROVIDER.on('block', setLatestBlockNumber) // TODO: change to Arb1 before going live
    return () => {
      ARBITRUM_RINKEBY_PROVIDER.removeListener('block', setLatestBlockNumber) // TODO: change to Arb1 before going live
    }
  }, [])

  useEffect(() => {
    if (!account || !swprClaimerContract || !latestBlockNumber || claimTxConfirmed) {
      setClaimed(true)
      setLoading(false)
      return
    }
    setLoading(true)
    swprClaimerContract
      .claimed(account, { blockTag: latestBlockNumber })
      .then(setClaimed)
      .catch(console.error)
      .finally(() => {
        setLoading(false)
      })
  }, [account, swprClaimerContract, latestBlockNumber, claimTxConfirmed])

  return { loading, claimed }
}
