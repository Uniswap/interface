import Column from 'components/Column'
import Row from 'components/Row'
import { GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import { DataPageDescription } from './DataPageDescription'
import { DataPageHeader } from './DataPageHeader'
import { DataPageTable } from './DataPageTable'
import { DataPageTraits } from './DataPageTraits'

const DataPageContainer = styled(Column)`
  height: 100%;
  width: 100%;
  gap: 36px;
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
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

export const DataPage = ({ asset }: { asset: GenieAsset }) => {
  return (
    <DataPageContainer>
      <DataPageHeader asset={asset} />
      <ContentContainer>
        <LeftColumn>
          {!!asset.traits?.length && <DataPageTraits asset={asset} />}
          <DataPageDescription />
        </LeftColumn>
        <DataPageTable asset={asset} />
      </ContentContainer>
    </DataPageContainer>
  )
}
