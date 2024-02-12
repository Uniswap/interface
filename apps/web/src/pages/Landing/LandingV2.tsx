import { memo } from 'react'
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
  gap: 80px;
  margin-top: -100px;
`

function LandingV2() {
  return (
    <Container>
      <Hero />
      <DirectToDefi />
      <Stats />
      <NewsletterEtc />
      <Footer />
    </Container>
  )
}

export default memo(LandingV2)
