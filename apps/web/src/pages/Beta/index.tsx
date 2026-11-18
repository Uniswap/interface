import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { BetaPasscodeModal } from '~/pages/Beta/BetaPasscodeModal'

/** The passcode gate over `page` (the route table passes the Landing page). */
export function BetaPage({ page }: { page: ReactNode }): JSX.Element {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  if (isEmbeddedWalletEnabled) {
    return <Navigate to="/?intro=true" replace />
  }

  return (
    <>
      {page}
      <BetaPasscodeModal />
    </>
  )
}

export default BetaPage
