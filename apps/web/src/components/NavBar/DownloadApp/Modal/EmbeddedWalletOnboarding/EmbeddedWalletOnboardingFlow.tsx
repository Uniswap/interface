import { useState } from 'react'
import { AnimatedPager } from 'ui/src'
import { HeightAnimator } from 'ui/src/animations/components/HeightAnimator'
import { useSuggestedUnitag } from 'uniswap/src/features/unitags/suggestions/useSuggestedUnitag'
import { CreateWalletScreen } from '~/components/NavBar/DownloadApp/Modal/EmbeddedWalletOnboarding/CreateWalletScreen'
import { WelcomeScreen } from '~/components/NavBar/DownloadApp/Modal/EmbeddedWalletOnboarding/WelcomeScreen'

/**
 * Treatment (arm B) of the embedded-wallet onboarding A/B test: a welcome screen followed by a
 * combined unitag-select + create-wallet screen. Mounted only while the modal is open, so the
 * unitag suggestion pre-warm begins on the welcome screen and the flow resets to welcome on reopen.
 */
export function EmbeddedWalletOnboardingFlow({ onClose }: { onClose: () => void }): JSX.Element {
  const [showCreate, setShowCreate] = useState(false)
  const suggested = useSuggestedUnitag()

  return (
    <HeightAnimator animation="quickLong">
      <AnimatedPager animation="quickLong" currentIndex={showCreate ? 1 : 0}>
        <WelcomeScreen onContinue={() => setShowCreate(true)} onClose={onClose} />
        <CreateWalletScreen suggested={suggested} goBack={() => setShowCreate(false)} onClose={onClose} />
      </AnimatedPager>
    </HeightAnimator>
  )
}
