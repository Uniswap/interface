import { Box } from 'nft/components/Box'
import { Column } from 'nft/components/Flex'
import { CloseDropDownIcon } from 'nft/components/icons'
import { bodySmall, buttonMedium, headlineSmall } from 'nft/css/common.css'
import { useBag, useIsMobile, useSellAsset, useSellPageState } from 'nft/hooks'
import { SellPageStateType } from 'nft/types'
import { lazy } from 'react'
import { useLocation } from 'react-router-dom'

import * as styles from './Cart.css'
import { orderButton } from './CartBalance.css'

const CartSellAssetRow = lazy(() => import('./CartSellAssetRow'))

const Cart = () => {
  const location = useLocation()
  const isSell = location.pathname === '/nfts/sell'
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const setSellPageState = useSellPageState((state) => state.setSellPageState)
  const sellPageState = useSellPageState((state) => state.state)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()

  return (
    <Column
      marginTop={{ md: '4', sm: '0' }}
      marginRight={{ md: '20', sm: '0' }}
      className={styles.cartContainer}
      width={{ md: '288', sm: 'full' }}
      height={{ sm: 'full', md: 'auto' }}
      backgroundColor="white"
      marginLeft="0"
      justifyContent="flex-start"
    >
      {isSell && sellPageState === SellPageStateType.LISTING ? null : (
        <>
          <BagHeader isSell={isSell} bagQuantity={isSell ? sellAssets.length : 0} />
          {isSell ? (
            <Column
              overflowX="hidden"
              overflowY="auto"
              position="relative"
              paddingTop="6"
              paddingBottom="6"
              height="full"
              className={styles.cartAssets}
            >
              {sellAssets.length
                ? sellAssets.map((asset, index) => <CartSellAssetRow asset={asset} key={index} />)
                : null}
            </Column>
          ) : null}
          {isSell ? (
            <Box padding="12">
              <Box
                as="button"
                className={`${buttonMedium} ${orderButton}`}
                disabled={sellAssets.length === 0}
                onClick={() => {
                  isMobile && toggleCart()
                  setSellPageState(SellPageStateType.LISTING)
                }}
              >
                Continue
              </Box>
            </Box>
          ) : null}
        </>
      )}
    </Column>
  )
}

const BagHeader = ({ bagQuantity, isSell }: { bagQuantity: number; isSell: boolean }) => {
  const toggleCart = useBag((state) => state.toggleBag)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const isMobile = useIsMobile()
  return (
    <Box position="relative" zIndex="2" paddingTop="20" paddingLeft="12" paddingRight="12">
      {isMobile ? (
        <Box
          as="button"
          border="none"
          color="darkGray"
          background="black"
          className={styles.closeIcon}
          onClick={toggleCart}
        >
          <CloseDropDownIcon />
        </Box>
      ) : null}
      <Box className={headlineSmall} paddingTop="0" paddingBottom="8" paddingX="0" margin="0">
        {isSell ? 'Selected items' : 'My Bag'}
      </Box>
      {bagQuantity > 0 ? (
        <Box className={bodySmall} paddingTop="0" paddingBottom="8" paddingX="0" marginY="0" marginX="auto">
          {bagQuantity} {bagQuantity === 1 ? 'NFT' : 'NFTs'}
          <span style={{ fontSize: '8px', position: 'relative', top: '-2px', padding: '0 2px 0 4px' }}>&#x2022;</span>
          <Box
            as="span"
            color="blue400"
            onClick={isSell ? resetSellAssets : undefined}
            cursor="pointer"
            paddingLeft="2"
          >
            Remove all
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

export default Cart
