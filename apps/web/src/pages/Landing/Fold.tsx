import { forwardRef } from 'react'
import { DirectToDefi } from './sections/DirectToDefi'
import { Footer } from './sections/Footer'
import { NewsletterEtc } from './sections/NewsletterEtc'
import { Stats } from './sections/Stats'

import styled from 'styled-components'

const Container = styled.div`
  gap: 120px;
  @media (max-width: 1024px) {
    gap: 80px;
  }
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  z-index: 1;
`

const Fold = forwardRef<HTMLDivElement>(function Fold(props, scrollAnchor) {
  return (
    <Container ref={scrollAnchor}>
      <DirectToDefi />
      <Stats />
      <NewsletterEtc />
      <Footer />
    </Container>
  )
})

export default Fold
