import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { RowsCollpsedIcon, RowsExpandedIcon, VerifiedIcon } from 'nft/components/icons'
import { bodySmall, subhead } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { ListingMarket, WalletAsset } from 'nft/types'
import { Dispatch, useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import { MarketplaceRow } from './MarketplaceRow'
import { SetPriceMethod } from './NFTListingsGrid'

const IconWrap = styled.div<{ hovered: boolean }>`
  position: absolute;
  left: 50%;
  top: 30px;
  transform: translateX(-50%);
  width: 32px;
  visibility: ${({ hovered }) => (hovered ? 'visible' : 'hidden')};
`

const StyledImg = styled.img`
  width: 32px;
  height: 32px;
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
  const [expandMarketplaceRows, setExpandMarketplaceRows] = useState(false)
  const removeAsset = useSellAsset((state) => state.removeSellAsset)
  const [localMarkets, setLocalMarkets] = useState([])
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)

  useEffect(() => {
    setLocalMarkets(JSON.parse(JSON.stringify(selectedMarkets)))
    selectedMarkets.length < 2 && setExpandMarketplaceRows(false)
  }, [selectedMarkets])

  return (
    <Row marginY="24">
      <Row flexWrap="nowrap" flex={{ sm: '2', md: '1.5' }} marginTop="0" marginBottom="auto" minWidth="0">
        <Box
          transition="500"
          style={{
            maxWidth: localMarkets.length > 1 ? '28px' : '0',
            opacity: localMarkets.length > 1 ? '1' : '0',
          }}
          cursor="pointer"
          marginRight="8"
          onClick={() => setExpandMarketplaceRows(!expandMarketplaceRows)}
        >
          {expandMarketplaceRows ? <RowsExpandedIcon /> : <RowsCollpsedIcon />}
        </Box>
        <Box
          position="relative"
          cursor="pointer"
          onMouseEnter={handleHover}
          onMouseLeave={handleHover}
          width="48"
          height="48"
          marginRight="8"
          onClick={() => {
            removeAsset(asset)
          }}
        >
          <IconWrap hovered={hovered}>
            <StyledImg src="/nft/svgs/minusCircle.svg" alt="Remove item" />
          </IconWrap>
          <Box
            as="img"
            alt={asset.name}
            width="48"
            height="48"
            borderRadius="8"
            marginRight="8"
            transition="500"
            src={asset.imageUrl || '/nft/svgs/image-placeholder.svg'}
          />
        </Box>
        <Column gap="4" minWidth="0">
          <Box paddingRight="8" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" className={subhead}>
            {asset.name ? asset.name : `#${asset.tokenId}`}
          </Box>
          <Box
            paddingRight="8"
            color="textSecondary"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            className={bodySmall}
          >
            {asset.collection?.name}
            {asset.collectionIsVerified && <VerifiedIcon style={{ marginBottom: '-5px' }} />}
          </Box>
        </Column>
      </Row>
      <Column flex={{ sm: '1', md: '3' }} gap="24">
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
                key={index}
                expandMarketplaceRows={expandMarketplaceRows}
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
          />
        )}
      </Column>
    </Row>
  )
}
