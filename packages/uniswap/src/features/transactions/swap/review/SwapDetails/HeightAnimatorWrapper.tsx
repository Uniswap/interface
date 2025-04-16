import { HeightAnimator } from 'ui/src'
import { isMobileApp, isMobileWeb } from 'utilities/src/platform'

/**
 * We don't need to animate the height on mobile or mobile web because the bottom sheet already handles the animation.
 */
export function HeightAnimatorWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  if (isMobileApp || isMobileWeb) {
    return <>{children}</>
  }

  return (
    <HeightAnimator useInitialHeight animation="fast">
      {children}
    </HeightAnimator>
  )
}
