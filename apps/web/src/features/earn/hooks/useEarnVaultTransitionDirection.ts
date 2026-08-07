import { useEffect, useState } from 'react'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import { usePrevious } from 'utilities/src/react/hooks'

type EarnVaultTransitionDirection = 'forward' | 'backward'

const EARN_VAULT_VIEW_DEPTH: Record<EarnVaultView, number> = {
  [EarnVaultView.Vault]: 0,
  [EarnVaultView.HowItWorks]: 1,
  [EarnVaultView.NeedToken]: 2,
  [EarnVaultView.DepositAmount]: 2,
  [EarnVaultView.DepositReview]: 3,
  [EarnVaultView.WithdrawAmount]: 1,
  [EarnVaultView.WithdrawReview]: 2,
}

export function useEarnVaultTransitionDirection(view: EarnVaultView): EarnVaultTransitionDirection {
  const previousView = usePrevious(view)
  const [direction, setDirection] = useState<EarnVaultTransitionDirection>('forward')

  useEffect(() => {
    if (previousView === undefined || previousView === view) {
      return
    }

    setDirection(EARN_VAULT_VIEW_DEPTH[view] < EARN_VAULT_VIEW_DEPTH[previousView] ? 'backward' : 'forward')
  }, [previousView, view])

  return direction
}
