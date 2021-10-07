import { useEffect, useState } from 'react'
import { ARBITRUM_ONE_PROVIDER } from '../../constants'
import { useClaimTxConfirmed } from '../../state/claim/hooks'
import { useSWPRClaimerContract } from '../useContract'

export default function useHasClaimed(account: string | null | undefined): { loading: boolean; claimed: boolean } {
  const swprClaimerContract = useSWPRClaimerContract()
  const [claimed, setClaimed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [latestBlockNumber, setLatestBlockNumber] = useState(0)
  const claimTxConfirmed = useClaimTxConfirmed()

  useEffect(() => {
    ARBITRUM_ONE_PROVIDER.on('block', setLatestBlockNumber)
    return () => {
      ARBITRUM_ONE_PROVIDER.removeListener('block', setLatestBlockNumber)
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
      .claimed(account)
      .then(setClaimed)
      .catch(console.error)
      .finally(() => {
        setLoading(false)
      })
  }, [account, swprClaimerContract, latestBlockNumber, claimTxConfirmed])

  return { loading, claimed }
}
