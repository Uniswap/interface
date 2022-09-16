import Loader from 'components/Loader'
import { Box } from 'nft/components/Box'
import { Column } from 'nft/components/Flex'
import { CloseDropDownIcon } from 'nft/components/icons'
import { bodySmall, buttonMedium, headlineSmall } from 'nft/css/common.css'
import { useBag, useIsMobile, useSellAsset, useSellPageState } from 'nft/hooks'
import { SellPageStateType } from 'nft/types'
import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'

import * as styles from './Cart.css'
import { orderButton } from './CartBalance.css'

const CartSellAssetRow = lazy(() => import('./CartSellAssetRow'))

const Cart = () => {
  const { pathname } = useLocation()
  const isSell = pathname === '/nfts/sell'
  const isNFTPage = pathname.startsWith('/nfts')
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const setSellPageState = useSellPageState((state) => state.setSellPageState)
  const sellPageState = useSellPageState((state) => state.state)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()
  const bagExpanded = useBag((s) => s.bagExpanded)

  return (
    <Box
      zIndex={{ sm: '3', md: '2' }}
      width={{ sm: 'full', md: 'auto' }}
      height={{ sm: 'full', md: 'auto' }}
      position="fixed"
      left={{ sm: '0', md: 'unset' }}
      right={{ sm: 'unset', md: '0' }}
      top={{ sm: '0', md: 'unset' }}
      display={bagExpanded && isNFTPage ? 'flex' : 'none'}
    >
      <Suspense fallback={<Loader />}>
        <Column
          marginTop={{ sm: '0', md: '4' }}
          marginRight={{ sm: '0', md: '20' }}
          className={styles.cartContainer}
          width={{ sm: 'full', md: '288' }}
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
      </Suspense>
    </Box>
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
