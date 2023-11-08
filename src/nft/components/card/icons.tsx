import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { getMarketplaceIcon } from 'nft/components/card/utils'
import { CollectionSelectedAssetIcon } from 'nft/components/icons'
import { Markets } from 'nft/types'
import { AlertTriangle, Check, Tag } from 'react-feather'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const StyledMarketplaceContainer = styled.div<{ isText?: boolean }>`
  position: absolute;
  display: flex;
  top: 12px;
  left: 12px;
  height: 32px;
  width: ${({ isText }) => (isText ? 'auto' : '32px')};
  padding: ${({ isText }) => (isText ? '0px 8px' : '0px')};
  background: rgba(93, 103, 133, 0.24);
  color: ${({ theme }) => theme.deprecated_accentTextLightPrimary};
  justify-content: center;
  align-items: center;
  border-radius: 32px;
  z-index: 2;
`

const ListPriceRowContainer = styled(Row)`
  gap: 6px;
  color: ${({ theme }) => theme.deprecated_accentTextLightPrimary};
  font-size: 14px;
  font-weight: 535;
  line-height: 16px;
  text-shadow: 1px 1px 3px rgba(51, 53, 72, 0.54);
`

export const MarketplaceContainer = ({
  isSelected,
  marketplace,
  tokenType,
  listedPrice,
  hidePrice,
}: {
  isSelected: boolean
  marketplace?: Markets
  tokenType?: NftStandard
  listedPrice?: string
  hidePrice?: boolean
}) => {
  if (isSelected) {
    if (!marketplace) {
      return (
        <StyledMarketplaceContainer>
          <Check size={20} />
        </StyledMarketplaceContainer>
      )
    }

    return (
      <StyledMarketplaceContainer>
        <CollectionSelectedAssetIcon width="20px" height="20px" viewBox="0 0 20 20" />
      </StyledMarketplaceContainer>
    )
  }

  if (listedPrice && !hidePrice) {
    return (
      <StyledMarketplaceContainer isText={true}>
        <ListPriceRowContainer>
          <Tag size={20} />
          {listedPrice} ETH
        </ListPriceRowContainer>
      </StyledMarketplaceContainer>
    )
  }

  if (!marketplace || tokenType === NftStandard.Erc1155) {
    return null
  }

  return <StyledMarketplaceContainer>{getMarketplaceIcon(marketplace)}</StyledMarketplaceContainer>
}

const SuspiciousIcon = styled(AlertTriangle)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.critical};
`

interface RankingProps {
  provider: { url?: string; rank?: number }
}

const RarityLogoContainer = styled(Row)`
  margin-right: 8px;
  width: 16px;
`

const RarityText = styled(ThemedText.BodySmall)`
  display: flex;
`

const RarityInfo = styled(ThemedText.BodySmall)`
  flex-shrink: 0;
  color: ${({ theme }) => theme.neutral2};
  background: ${({ theme }) => theme.surface3};
  padding: 4px 6px;
  border-radius: 4px;
  font-weight: 535 !important;
  line-height: 12px;
  text-align: right;
  cursor: pointer;
`

export const Ranking = ({ provider }: RankingProps) => {
  const { formatNumber } = useFormatter()

  if (!provider.rank) {
    return null
  }

  return (
    <RarityInfo>
      <MouseoverTooltip
        text={
          <Row>
            <RarityLogoContainer>
              <img src="/nft/svgs/gem.svg" width={16} height={16} />
            </RarityLogoContainer>
            <RarityText>Ranking by Rarity Sniper</RarityText>
          </Row>
        }
        placement="top"
      >
        # {formatNumber({ input: provider.rank, type: NumberType.WholeNumber })}
      </MouseoverTooltip>
    </RarityInfo>
  )
}

const SuspiciousIconContainer = styled(Row)`
  flex-shrink: 0;
`

export const Suspicious = () => {
  return (
    <MouseoverTooltip
      text={
        <ThemedText.BodySmall>
          <Trans>Blocked on OpenSea</Trans>
        </ThemedText.BodySmall>
      }
      placement="top"
    >
      <SuspiciousIconContainer>
        <SuspiciousIcon />
      </SuspiciousIconContainer>
    </MouseoverTooltip>
  )
}
