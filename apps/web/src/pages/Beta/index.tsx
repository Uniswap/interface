import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Navigate } from 'react-router'
import { BetaPasscodeModal } from '~/pages/Beta/BetaPasscodeModal'
import { Landing } from '~/pages/Landing'

export function BetaPage(): JSX.Element {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)

  if (isEmbeddedWalletEnabled) {
    return <Navigate to="/?intro=true" replace />
  }

  return (
    <>
      <Landing />
      <BetaPasscodeModal />
    </>
  )
}

export default BetaPage
