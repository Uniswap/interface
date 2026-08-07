import { useDispatch } from 'react-redux'
import { setHasAcknowledgedEarnHowItWorks } from 'uniswap/src/features/behaviorHistory/slice'
import { logEarnHowItWorksAcknowledged } from 'uniswap/src/features/earn/analytics'
import type { EarnAnalyticsBaseProperties } from 'uniswap/src/features/telemetry/types'
import { useEvent } from 'utilities/src/react/hooks'

export function useAcknowledgeEarnHowItWorks({
  analyticsProperties,
  onContinue,
  vaultId,
}: {
  analyticsProperties?: EarnAnalyticsBaseProperties
  onContinue: () => void
  vaultId?: string
}): () => void {
  const dispatch = useDispatch()

  return useEvent(() => {
    if (!analyticsProperties || !vaultId) {
      return
    }

    logEarnHowItWorksAcknowledged(analyticsProperties)
    dispatch(setHasAcknowledgedEarnHowItWorks({ vaultId }))
    onContinue()
  })
}
