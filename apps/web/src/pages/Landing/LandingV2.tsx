import { Suspense, lazy, memo, useRef } from 'react'
import styled from 'styled-components'

import { Hero } from './sections/Hero'

// The Fold is always loaded, but is lazy-loaded because it is not seen without user interaction.
// Annotating it with webpackPreload allows it to be ready when requested.
const Fold = lazy(() => import(/* webpackPreload: true */ './Fold'))

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 120px;
  @media (max-width: 1024px) {
    gap: 80px;
  }
  margin-top: -72px;
  min-width: 100%;
  max-width: 1280px;
  z-index: 1;
`

const Grain = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
    <>
      <Grain />
      <Container data-testid="landing-page">
        <Hero scrollToRef={scrollToRef} transition={transition} />
        <Suspense>
          <Fold ref={scrollAnchor} />
        </Suspense>
      </Container>
    </>
  )
}

export default memo(LandingV2)
