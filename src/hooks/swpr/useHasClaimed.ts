import { useEffect, useState } from 'react'
import { useSWPRClaimerContract } from '../useContract'

export default function useHasClaimed(account: string | null | undefined): { loading: boolean; claimed: boolean } {
  const swprClaimerContract = useSWPRClaimerContract()
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!account || !swprClaimerContract) {
      setClaimed(true)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      swprClaimerContract
        .claimed(account)
        .then(setClaimed)
        .catch(console.error)
    } finally {
      setLoading(false)
    }
  }, [account, swprClaimerContract])

  return { loading, claimed }
}
