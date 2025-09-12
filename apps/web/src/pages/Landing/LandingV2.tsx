import { Hero } from 'pages/Landing/sections/Hero'
import { lazy, memo, Suspense, useRef } from 'react'
import { Flex, styled } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'

// The Fold is always loaded, but is lazy-loaded because it is not seen without user interaction.
// Annotating it with webpackPreload allows it to be ready when requested.
const Fold = lazy(() => import(/* webpackPreload: true */ './Fold'))

const Rive = lazy(() => import(/* webpackPreload: true */ 'setupRive'))

const Grain = styled(Flex, {
  position: 'absolute',
  inset: 0,
  background: 'url(/images/noise-color.png)',
  opacity: 0.018,
  zIndex: 0,
})

function LandingV2({ transition }: { transition?: boolean }) {
  const scrollAnchor = useRef<HTMLDivElement | null>(null)
  const scrollToRef = () => {
    if (scrollAnchor.current) {
      window.scrollTo({
        top: scrollAnchor.current.offsetTop - 120,
        behavior: 'smooth',
      })
    }
  }

  return (
    <Flex
      position="relative"
      alignItems="center"
      mt={-INTERFACE_NAV_HEIGHT}
      minWidth="100vw"
      data-testid="landing-page"
    >
      <Grain />
      <Hero scrollToRef={scrollToRef} transition={transition} />
      <Suspense>
        <Rive />
        <Fold ref={scrollAnchor} />
      </Suspense>
    </Flex>
  )
}

export default memo(LandingV2)
