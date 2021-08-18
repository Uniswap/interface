import { useEffect, useState } from 'react'
import { ARBITRUM_ONE_PROVIDER } from '../../constants'
import { useClaimTxConfirmed } from '../../state/claim/hooks'
import { useSWPRClaimerContract } from '../useContract'

export default function useHasClaimed(account: string | null | undefined): { loading: boolean; claimed: boolean } {
  const swprClaimerContract = useSWPRClaimerContract()
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [arbitrumOneBlockNumber, setArbitrumOneBlockNumber] = useState(0)
  const claimTxConfirmed = useClaimTxConfirmed()

  useEffect(() => {
    ARBITRUM_ONE_PROVIDER.on('block', setArbitrumOneBlockNumber)
    return () => {
      ARBITRUM_ONE_PROVIDER.removeListener('block', setArbitrumOneBlockNumber)
    }
  }, [])

  useEffect(() => {
    if (!account || !swprClaimerContract || !arbitrumOneBlockNumber || claimTxConfirmed) {
      setClaimed(true)
      setLoading(false)
      return
    }
    setLoading(true)
    swprClaimerContract
      .claimed(account, { blockTag: arbitrumOneBlockNumber })
      .then(setClaimed)
      .catch(console.error)
      .finally(() => {
        setLoading(false)
      })
  }, [account, swprClaimerContract, arbitrumOneBlockNumber, claimTxConfirmed])

  return { loading, claimed }
}
