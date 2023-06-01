import Column from 'components/Column'
import Row from 'components/Row'
import { VerifiedIcon } from 'nft/components/icons'
import { GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

import { BuyButton } from './BuyButton'

const HeaderContainer = styled(Row)`
  gap: 24px;
`

const AssetImage = styled.img`
  width: 96px;
  height: 96px;
  border-radius: 20px;
  object-fit: cover;

  @media screen and (max-width: ${BREAKPOINTS.lg}px) {
    display: none;
  }
`

const AssetText = styled(Column)`
  gap: 4px;
  margin-right: auto;
`

export const DataPageHeader = ({ asset }: { asset: GenieAsset }) => {
  return (
    <HeaderContainer>
      <AssetImage src={asset.imageUrl} />
      <AssetText>
        <Row gap="4px">
          <ThemedText.SubHeaderSmall>{asset.collectionName}</ThemedText.SubHeaderSmall>
          <VerifiedIcon width="16px" height="16px" />
        </Row>
        <ThemedText.HeadlineMedium>
          {asset.name ?? `${asset.collectionName} #${asset.tokenId}`}
        </ThemedText.HeadlineMedium>
      </AssetText>
      <Row justifySelf="flex-end" width="min-content" gap="12px">
        <BuyButton asset={asset} onDataPage />
      </Row>
    </HeaderContainer>
  )
}
