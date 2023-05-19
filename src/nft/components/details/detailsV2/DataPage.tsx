import Column from 'components/Column'
import Row from 'components/Row'
import { GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import { DataPageDescription } from './DataPageDescription'
import { DataPageHeader } from './DataPageHeader'
import { DataPageTable } from './DataPageTable'
import { DataPageTraits } from './DataPageTraits'

const DataPagePaddingContainer = styled.div`
  padding: 24px 64px;
  height: 100vh;
  width: 100%;

  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    height: 100%;
  }

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    padding: 24px 48px;
  }

  @media screen and (max-width: ${BREAKPOINTS.xs}px) {
    padding: 24px 20px;
  }
`

const DataPageContainer = styled(Column)`
  height: 100%;
  width: 100%;
  gap: 36px;
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
`

const HeaderContainer = styled.div<{ showDataHeader?: boolean }>`
  position: sticky;
  top: ${({ theme }) => `${theme.navHeight}px`};
  padding-top: 16px;
  backdrop-filter: blur(12px);
  z-index: 1;
  transition: ${({ theme }) => `opacity ${theme.transition.duration.fast}`};
  opacity: ${({ showDataHeader }) => (showDataHeader ? '1' : '0')};

  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    display: none;
  }
`

const ContentContainer = styled(Row)`
  gap: 24px;
  padding-bottom: 45px;

  @media screen and (max-width: ${BREAKPOINTS.lg}px) {
    flex-wrap: wrap;
  }
`

const LeftColumn = styled(Column)`
  gap: 24px;
  width: 100%;
  align-self: flex-start;
`

export const DataPage = ({ asset, showDataHeader }: { asset: GenieAsset; showDataHeader: boolean }) => {
  return (
    <DataPagePaddingContainer>
      <DataPageContainer>
        <HeaderContainer showDataHeader={showDataHeader}>
          <DataPageHeader asset={asset} />
        </HeaderContainer>
        <ContentContainer>
          <LeftColumn>
            {!!asset.traits?.length && <DataPageTraits asset={asset} />}
            <DataPageDescription />
          </LeftColumn>
          <DataPageTable asset={asset} />
        </ContentContainer>
      </DataPageContainer>
    </DataPagePaddingContainer>
  )
}
