import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { getRoyalty } from 'nft/components/profile/list/utils'
import { ListingMarket, WalletAsset } from 'nft/types'
import { getMarketplaceIcon } from 'nft/utils'
import styled, { css } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const FeeWrap = styled(Row)`
  margin-bottom: 4px;
  justify-content: space-between;
`

const RoyaltyContainer = styled(Column)`
  gap: 12px;
  padding: 4px 0px;
`

const iconStyles = css`
  width: 16px;
  height: 16px;
  outline: 1px solid ${({ theme }) => theme.surface3};
  margin-right: 8px;
`

const MarketIcon = styled.div`
  border-radius: 4px;
  ${iconStyles}
`

const CollectionIcon = styled.img`
  object-fit: cover;
  border-radius: 50%;
  ${iconStyles}
`

const FeePercent = styled(ThemedText.BodySmall)`
  line-height: 16px;
  color: ${({ theme }) => theme.neutral2};
  white-space: nowrap;
`

const MaxFeeContainer = styled(Row)`
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.surface3};
`

export const RoyaltyTooltip = ({
  selectedMarkets,
  asset,
  fees,
}: {
  selectedMarkets: ListingMarket[]
  asset: WalletAsset
  fees?: number
}) => {
  const { formatNumberOrString, formatDelta } = useFormatter()
  const maxRoyalty = Math.max(...selectedMarkets.map((market) => getRoyalty(market, asset) ?? 0))
  return (
    <RoyaltyContainer>
      {selectedMarkets.map((market) => (
        <FeeWrap key={asset.collection?.address ?? '' + asset.tokenId + market.name + 'fee'}>
          <Row>
            <MarketIcon>{getMarketplaceIcon(market.name, '16')}</MarketIcon>
            <ThemedText.BodySmall lineHeight="16px" marginRight="12px">
              {market.name}&nbsp;
              <Trans>fee</Trans>
            </ThemedText.BodySmall>
          </Row>
          <FeePercent>{formatDelta(market.fee)}</FeePercent>
        </FeeWrap>
      ))}
      <FeeWrap>
        <Row>
          <CollectionIcon src={asset.collection?.imageUrl} />
          <ThemedText.BodySmall lineHeight="16px" marginRight="12px">
            <Trans>Max creator royalties</Trans>
          </ThemedText.BodySmall>
        </Row>
        <FeePercent>{maxRoyalty}%</FeePercent>
      </FeeWrap>
      <MaxFeeContainer>
        <ThemedText.BodySmall lineHeight="16px">
          <Trans>Max fees</Trans>
        </ThemedText.BodySmall>
        <ThemedText.BodySmall lineHeight="16px" color={fees ? 'neutral1' : 'neutral2'}>
          {fees ? formatNumberOrString({ input: fees, type: NumberType.NFTToken }) : '-'} ETH
        </ThemedText.BodySmall>
      </MaxFeeContainer>
    </RoyaltyContainer>
  )
}
