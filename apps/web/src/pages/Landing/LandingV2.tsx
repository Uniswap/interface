import React, { memo, useRef } from 'react'
import styled from 'styled-components'

import { DirectToDefi } from './sections/DirectToDefi'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { NewsletterEtc } from './sections/NewsletterEtc'
import { Stats } from './sections/Stats'

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 120px;
  @media (max-width: 1024px) {
    gap: 80px;
  }
  margin-top: -100px;
  max-width: 1280px;
`

function LandingV2() {
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
    <Container>
      <Hero scrollToRef={scrollToRef} />
      <div ref={scrollAnchor}>
        <DirectToDefi />
      </div>
      <Stats />
      <NewsletterEtc />
      <Footer />
    </Container>
  )
}

export default memo(LandingV2)
