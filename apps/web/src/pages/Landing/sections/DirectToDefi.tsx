import styled from 'styled-components'

import { Trans } from '@lingui/macro'
import { Box, H2 } from '../components/Generics'
import { DocumentationCard } from '../components/cards/DocumentationCard'
import { DownloadWalletCard } from '../components/cards/DownloadWalletCard'
import { LiquidityCard } from '../components/cards/LiquidityCard'
import { WebappCard } from '../components/cards/WebappCard'

const SectionLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40px;
  @media (max-width: 768px) {
    padding: 0 48px;
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
  max-width: 1280px;
  gap: 32px;
  @media (max-width: 768px) {
    gap: 24px;
  }
`
export function DirectToDefi() {
  return (
    <SectionLayout>
      <SectionCol direction="column" gap="40px" maxWidth="1280px">
        <H2>
          <Trans>Go direct to DeFi</Trans>
        </H2>
        <Box direction="column" gap="16px">
          <RowToCol direction="row" gap="16px">
            <WebappCard />
            <DownloadWalletCard />
          </RowToCol>
          <RowToCol direction="row" gap="16px">
            <DocumentationCard />
            <LiquidityCard />
          </RowToCol>
        </Box>
      </SectionCol>
    </SectionLayout>
  )
}
