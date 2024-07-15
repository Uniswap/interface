import styled from 'lib/styled-components'
import { Hero } from 'pages/Landing/sections/Hero'
import { Suspense, lazy, memo, useRef } from 'react'

// The Fold is always loaded, but is lazy-loaded because it is not seen without user interaction.
// Annotating it with webpackPreload allows it to be ready when requested.
const Fold = lazy(() => import(/* webpackPreload: true */ './Fold'))

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: ${({ theme }) => `-${theme.navHeight}px`};
  min-width: 100vw;
  z-index: 1;
`

const Grain = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  background: url(/images/noise-color.png);
  opacity: 0.018;
  z-index: 0;
`

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
    <Container data-testid="landing-page">
      <Grain />
      <Hero scrollToRef={scrollToRef} transition={transition} />
      <Suspense>
        <Fold ref={scrollAnchor} />
      </Suspense>
    </Container>
  )
}

export default memo(LandingV2)
