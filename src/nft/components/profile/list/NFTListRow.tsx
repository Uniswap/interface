import Column from 'components/Column'
import Row from 'components/Row'
import { VerifiedIcon } from 'nft/components/icons'
import { useSellAsset } from 'nft/hooks'
import { ListingMarket, WalletAsset } from 'nft/types'
import { Dispatch, useEffect, useReducer, useState } from 'react'
import { Trash2 } from 'react-feather'
import styled, { css, useTheme } from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
import { opacify } from 'theme/utils'

import { MarketplaceRow } from './MarketplaceRow'
import { SetPriceMethod } from './NFTListingsGrid'

const NFTListRowWrapper = styled(Row)`
  padding: 24px 0px;
  align-items: center;
  border-radius: 8px;

  &:hover {
    background: ${({ theme }) => opacify(24, theme.backgroundOutline)};
  }
`

const RemoveIconContainer = styled.div`
  width: 48px;
  height: 44px;
  padding-left: 12px;
  align-self: flex-start;
  align-items: center;
  display: flex;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

const NFTInfoWrapper = styled(Row)`
  align-items: center;
  min-width: 0px;
  flex: 1.5;
  margin-bottom: auto;
`

const NFTImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  margin-right: 8px;
`

const HideTextOverflow = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TokenInfoWrapper = styled(Column)`
  gap: 4px;
  margin-right: 8px;
  min-width: 0px;
`

const TokenName = styled.div`
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  ${HideTextOverflow}
`

const CollectionName = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.textSecondary};
  line-height: 20px;
  ${HideTextOverflow};
`

const MarketPlaceRowWrapper = styled(Column)`
  gap: 24px;
  flex: 1.5;
  margin-right: 12px;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex: 2;
  }

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex: 3;
  }
`

interface NFTListRowProps {
  asset: WalletAsset
  globalPriceMethod?: SetPriceMethod
  setGlobalPrice: Dispatch<number | undefined>
  globalPrice?: number
  selectedMarkets: ListingMarket[]
}

/**
 * NFTListRow is the outermost row wrapper for an NFT Listing, which shows either the composite of multiple marketplaces listings
 * or can be expanded to show listings per marketplace
 */
export const NFTListRow = ({
  asset,
  globalPriceMethod,
  globalPrice,
  setGlobalPrice,
  selectedMarkets,
}: NFTListRowProps) => {
  const [expandMarketplaceRows, toggleExpandMarketplaceRows] = useReducer((s) => !s, false)
  const removeAsset = useSellAsset((state) => state.removeSellAsset)
  const [localMarkets, setLocalMarkets] = useState<ListingMarket[]>([])
  const [hovered, toggleHovered] = useReducer((s) => !s, false)
  const theme = useTheme()

  useEffect(() => {
    setLocalMarkets(JSON.parse(JSON.stringify(selectedMarkets)))
    selectedMarkets.length < 2 && expandMarketplaceRows && toggleExpandMarketplaceRows()
  }, [expandMarketplaceRows, selectedMarkets])

  return (
    <NFTListRowWrapper
      onMouseEnter={() => {
        !hovered && toggleHovered()
      }}
      onMouseLeave={() => {
        hovered && toggleHovered()
      }}
    >
      <RemoveIconContainer>
        {hovered && (
          <Trash2
            size={20}
            color={theme.textSecondary}
            cursor="pointer"
            onClick={() => {
              removeAsset(asset)
            }}
          />
        )}
      </RemoveIconContainer>

      <NFTInfoWrapper>
        <NFTImage alt={asset.name} src={asset.imageUrl || '/nft/svgs/image-placeholder.svg'} />
        <TokenInfoWrapper>
          <TokenName>{asset.name ? asset.name : `#${asset.tokenId}`}</TokenName>
          <CollectionName>
            {asset.collection?.name}
            {asset.collectionIsVerified && <VerifiedIcon style={{ marginBottom: '-5px' }} />}
          </CollectionName>
        </TokenInfoWrapper>
      </NFTInfoWrapper>
      <MarketPlaceRowWrapper>
        {expandMarketplaceRows ? (
          localMarkets.map((market, index) => {
            return (
              <MarketplaceRow
                globalPriceMethod={globalPriceMethod}
                globalPrice={globalPrice}
                setGlobalPrice={setGlobalPrice}
                selectedMarkets={[market]}
                removeMarket={() => localMarkets.splice(index, 1)}
                asset={asset}
                showMarketplaceLogo={true}
                key={asset.name + market.name}
                expandMarketplaceRows={expandMarketplaceRows}
                rowHovered={hovered}
                toggleExpandMarketplaceRows={toggleExpandMarketplaceRows}
              />
            )
          })
        ) : (
          <MarketplaceRow
            globalPriceMethod={globalPriceMethod}
            globalPrice={globalPrice}
            setGlobalPrice={setGlobalPrice}
            selectedMarkets={localMarkets}
            asset={asset}
            showMarketplaceLogo={false}
            rowHovered={hovered}
            toggleExpandMarketplaceRows={toggleExpandMarketplaceRows}
          />
        )}
      </MarketPlaceRowWrapper>
    </NFTListRowWrapper>
  )
}
