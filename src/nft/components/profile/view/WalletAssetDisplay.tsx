import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { bodySmall, buttonTextSmall, subhead } from 'nft/css/common.css'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { DetailsOrigin, WalletAsset } from 'nft/types'
import { formatEth, getAssetHref } from 'nft/utils'
import { useMemo, useReducer } from 'react'
import { Link } from 'react-router-dom'

import * as styles from './ProfilePage.css'

export const WalletAssetDisplay = ({ asset, isSellMode }: { asset: WalletAsset; isSellMode: boolean }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()

  const [boxHovered, toggleBoxHovered] = useReducer((state) => {
    return !state
  }, false)
  const [buttonHovered, toggleButtonHovered] = useReducer((state) => {
    return !state
  }, false)

  const isSelected = useMemo(() => {
    return sellAssets.some((item) => asset.id === item.id)
  }, [asset, sellAssets])

  const handleSelect = () => {
    isSelected ? removeSellAsset(asset) : selectSellAsset(asset)
    if (
      !cartExpanded &&
      !sellAssets.find(
        (x) => x.tokenId === asset.tokenId && x.asset_contract.address === asset.asset_contract.address
      ) &&
      !isMobile
    )
      toggleCart()
  }

  const uniqueSellOrdersMarketplaces = useMemo(
    () => [...new Set(asset.sellOrders.map((order) => order.marketplace))],
    [asset.sellOrders]
  )

  return (
    <Link to={getAssetHref(asset, DetailsOrigin.PROFILE)} style={{ textDecoration: 'none' }}>
      <Column
        borderBottomLeftRadius="20"
        borderBottomRightRadius="20"
        paddingBottom="20"
        transition="250"
        backgroundColor={boxHovered ? 'backgroundOutline' : 'backgroundSurface'}
        onMouseEnter={toggleBoxHovered}
        onMouseLeave={toggleBoxHovered}
      >
        <Box
          as="img"
          alt={asset.name}
          width="full"
          borderTopLeftRadius="20"
          borderTopRightRadius="20"
          src={asset.image_url ?? '/nft/svgs/image-placeholder.svg'}
          style={{ aspectRatio: '1' }}
        />
        <Column paddingTop="12" paddingX="12">
          <Row>
            <Column flex="2" gap="4" whiteSpace="nowrap" style={{ maxWidth: '67%' }}>
              <Box className={subhead} color="textPrimary" overflow="hidden" textOverflow="ellipsis">
                {asset.name ? asset.name : `#${asset.tokenId}`}
              </Box>
              <Box className={bodySmall} color="textSecondary" overflow="hidden" textOverflow="ellipsis">
                {asset.collection?.name}
                {asset.collectionIsVerified ? <VerifiedIcon className={styles.verifiedBadge} /> : null}
              </Box>
            </Column>
            {asset.sellOrders.length > 0 && (
              <Column gap="6" flex="1" justifyContent="flex-end" whiteSpace="nowrap" style={{ maxWidth: '33%' }}>
                <>
                  <Row className={subhead} color="textPrimary">
                    <Box width="full" textAlign="right" overflow="hidden" textOverflow="ellipsis">
                      {formatEth(asset.floor_sell_order_price)}
                    </Box>
                    &nbsp;ETH
                  </Row>
                  <Row justifyContent="flex-end">
                    {uniqueSellOrdersMarketplaces.map((market, index) => {
                      return (
                        <Box
                          as="img"
                          key={index}
                          alt={market}
                          width="16"
                          height="16"
                          borderRadius="4"
                          marginLeft="4"
                          objectFit="cover"
                          src={`/nft/svgs/marketplaces/${market}.svg`}
                        />
                      )
                    })}
                  </Row>
                </>
              </Column>
            )}
          </Row>
          {isSellMode && (
            <Box
              marginTop="12"
              textAlign="center"
              width="full"
              borderRadius="12"
              paddingY="8"
              transition="250"
              color={buttonHovered || isSelected ? 'textPrimary' : 'accentAction'}
              backgroundColor={
                buttonHovered
                  ? isSelected
                    ? 'accentFailure'
                    : 'accentAction'
                  : isSelected
                  ? 'backgroundInteractive'
                  : 'accentActionSoft'
              }
              className={buttonTextSmall}
              onMouseEnter={toggleButtonHovered}
              onMouseLeave={toggleButtonHovered}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelect()
              }}
            >
              {isSelected ? 'Remove' : 'Select'}
            </Box>
          )}
        </Column>
      </Column>
    </Link>
  )
}
