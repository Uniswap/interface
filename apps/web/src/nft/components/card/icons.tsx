import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { getMarketplaceIcon } from 'nft/components/card/utils'
import { CollectionSelectedAssetIcon } from 'nft/components/iconExports'
import { Markets } from 'nft/types'
import { Check, Tag } from 'react-feather'
import { NftStandard } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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
