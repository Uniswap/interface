import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { getMarketplaceFee, getRoyalty } from 'nft/components/profile/list/utils'
import { ListingMarket, WalletAsset } from 'nft/types'
import { formatEth } from 'nft/utils'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const FeeWrap = styled(Row)`
  margin-bottom: 4px;
  justify-content: space-between;
`

const RoyaltyContainer = styled(Column)`
  gap: 12px;
  padding: 4px 0px;
`

const MarketIcon = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 2px;
  object-fit: cover;
  outline: 1px solid ${({ theme }) => theme.backgroundInteractive};
  margin-right: 8px;
`

const CollectionIcon = styled(MarketIcon)`
  border-radius: 50%;
`

const FeePercent = styled(ThemedText.Caption)`
  line-height: 16px;
  color: ${({ theme }) => theme.textSecondary};
  white-space: nowrap;
`

const MaxFeeContainer = styled(Row)`
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
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
  const maxRoyalty = Math.max(...selectedMarkets.map((market) => getRoyalty(market, asset) ?? 0)).toFixed(2)
  return (
    <RoyaltyContainer>
      {selectedMarkets.map((market) => (
        <FeeWrap key={asset.collection?.address ?? '' + asset.tokenId + market.name + 'fee'}>
          <Row>
            <MarketIcon src={market.icon} />
            <ThemedText.Caption lineHeight="16px" marginRight="12px">
              {market.name}&nbsp;
              <Trans>fee</Trans>
            </ThemedText.Caption>
          </Row>
          <FeePercent>{getMarketplaceFee(market, asset)}%</FeePercent>
        </FeeWrap>
      ))}
      <FeeWrap>
        <Row>
          <CollectionIcon src={asset.collection?.imageUrl} />
          <ThemedText.Caption lineHeight="16px" marginRight="12px">
            <Trans>Max creator royalties</Trans>
          </ThemedText.Caption>
        </Row>
        <FeePercent>{maxRoyalty}%</FeePercent>
      </FeeWrap>
      <MaxFeeContainer>
        <ThemedText.Caption lineHeight="16px">
          <Trans>Max fees</Trans>
        </ThemedText.Caption>
        <ThemedText.Caption lineHeight="16px" color={fees ? 'textPrimary' : 'textSecondary'}>
          {fees ? formatEth(fees) : '-'} ETH
        </ThemedText.Caption>
      </MaxFeeContainer>
    </RoyaltyContainer>
  )
}
