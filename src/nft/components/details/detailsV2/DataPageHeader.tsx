import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { HandHoldingDollarIcon, VerifiedIcon } from 'nft/components/icons'
import { GenieAsset } from 'nft/types'
import { formatEth } from 'nft/utils'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const AssetImage = styled.img`
  width: 96px;
  height: 96px;
  border-radius: 20px;
`

const AssetText = styled(Column)`
  gap: 4px;
  flex-grow: 1;
`

const BuyButton = styled(ButtonPrimary)`
  display: flex;
  flex-direction: row;
  padding: 16px 24px;
  gap: 8px;
  line-height: 24px;
`

const Price = styled.div`
  color: ${({ theme }) => theme.textSecondary};
`

const MakeOfferButton = styled(ButtonPrimary)`
  border-radius: 12px;
  width: min-content;
  flex-shrink: 0;
`

export const DataPageHeader = ({ asset }: { asset: GenieAsset }) => {
  return (
    <Row gap="24px">
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
        <BuyButton>
          <Trans>Buy</Trans>
          <Price>{formatEth(2.22)}</Price>
        </BuyButton>
        <MakeOfferButton>
          <HandHoldingDollarIcon />
        </MakeOfferButton>
      </Row>
    </Row>
  )
}
