import { Trans } from '@lingui/macro'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { HandHoldingDollarIcon, VerifiedIcon } from 'nft/components/icons'
import { GenieAsset } from 'nft/types'
import { formatEth } from 'nft/utils'
import styled, { css } from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

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

const ButtonStyles = css`
  width: min-content;
  flex-shrink: 0;
  border-radius: 16px;
`

const BuyButton = styled(ButtonPrimary)`
  display: flex;
  flex-direction: row;
  padding: 16px 24px;
  gap: 8px;
  line-height: 24px;
  white-space: nowrap;
  ${ButtonStyles}
`

const Price = styled.div`
  color: ${({ theme }) => theme.accentTextLightSecondary};
`

const MakeOfferButtonSmall = styled(ButtonPrimary)`
  padding: 16px;
  ${ButtonStyles}
`

const MakeOfferButtonLarge = styled(ButtonGray)`
  white-space: nowrap;
  ${ButtonStyles}
`

export const DataPageHeader = ({ asset }: { asset: GenieAsset }) => {
  const price = asset.sellorders?.[0]?.price.value
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
        {price ? (
          <>
            <BuyButton>
              <Trans>Buy</Trans>
              <Price>{formatEth(price)} ETH</Price>
            </BuyButton>
            <MakeOfferButtonSmall>
              <HandHoldingDollarIcon />
            </MakeOfferButtonSmall>
          </>
        ) : (
          <MakeOfferButtonLarge>
            <Trans>Make an offer</Trans>
          </MakeOfferButtonLarge>
        )}
      </Row>
    </HeaderContainer>
  )
}
