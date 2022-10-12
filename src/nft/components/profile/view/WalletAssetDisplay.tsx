import { Box } from 'nft/components/Box'
import { Column } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { bodySmall, subheadSmall } from 'nft/css/common.css'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { DetailsOrigin, WalletAsset } from 'nft/types'
import { getAssetHref } from 'nft/utils'
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

  return (
    <Link to={getAssetHref(asset, DetailsOrigin.PROFILE)} style={{ textDecoration: 'none' }}>
      <Column
        // color={'textPrimary'}
        // className={subheadSmall}
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
        <Column
          position="relative"
          borderBottomLeftRadius="20"
          borderBottomRightRadius="20"
          transition="250"
          backgroundColor={boxHovered ? 'backgroundOutline' : 'backgroundSurface'}
          paddingTop="12"
          paddingBottom="20"
          paddingX="12"
        >
          <Box
            className={subheadSmall}
            color="textPrimary"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {asset.name ? asset.name : `#${asset.tokenId}`}
          </Box>
          <Box
            className={bodySmall}
            color="textSecondary"
            marginTop="4"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {asset.collection?.name}
            {asset.collectionIsVerified ? <VerifiedIcon className={styles.verifiedBadge} /> : null}
          </Box>
          {/* <Box as="span" fontSize="12" lineHeight="16" color="textSecondary" marginTop="8">
            Last:&nbsp;
            {asset.lastPrice ? (
              <>
                {formatEth(asset.lastPrice)}
                &nbsp;ETH
              </>
            ) : (
              <Box as="span" marginLeft="6">
                &mdash;
              </Box>
            )}
          </Box>
          <Box as="span" fontSize="12" lineHeight="16" color="textSecondary" marginTop="4">
            Floor:&nbsp;
            {asset.floorPrice ? (
              <>
                {formatEth(asset.floorPrice)}
                &nbsp;ETH
              </>
            ) : (
              <Box as="span" marginLeft="8">
                &mdash;
              </Box>
            )}
          </Box> */}
          {isSellMode && (
            <Box
              marginTop="12"
              textAlign="center"
              width="full"
              borderRadius="12"
              paddingY="8"
              transition="250"
              color={buttonHovered ? 'textPrimary' : isSelected ? 'red400' : 'genieBlue'}
              backgroundColor={buttonHovered ? (isSelected ? 'red400' : 'genieBlue') : 'backgroundSurface'}
              className={subheadSmall}
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
