import { useInView } from 'react-intersection-observer'
import styled from 'styled-components'

import { DocumentationCard } from '../components/cards/DocumentationCard'
import { DownloadWalletCard } from '../components/cards/DownloadWalletCard'
import { LiquidityCard } from '../components/cards/LiquidityCard'
import { WebappCard } from '../components/cards/WebappCard'
import { Box, H2 } from '../components/Generics'

export function DirectToDefi() {
  const { ref, inView, entry } = useInView({
    /* Optional options */
    threshold: 0,
  })
  return (
    <SectionLayout>
      <SectionCol direction="column" gap="48px" maxWidth="1328px">
        <H2>Go direct to DeFi</H2>
        <Box direction="column" gap="24px">
          <RowToCol direction="row" gap="24px">
            <WebappCard />
            <DownloadWalletCard />
          </RowToCol>
          <RowToCol direction="row" gap="24px">
            <DocumentationCard />
            <LiquidityCard />
          </RowToCol>
        </Box>
      </SectionCol>
    </SectionLayout>
  )
}

const SectionLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px;
  @media (max-width: 768px) {
    padding: 0 64px;
  }
  @media (max-width: 468px) {
    padding: 0 24px;
  }
`

const RowToCol = styled(Box)`
  height: auto;
  flex-shrink: 1;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`
const SectionCol = styled(Box)`
  flex-direction: column;
  max-width: 1328px;
  gap: 48px;
  @media (max-width: 768px) {
    gap: 24px;
  }
`
