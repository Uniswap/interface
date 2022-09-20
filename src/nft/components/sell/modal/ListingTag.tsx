import Loader from 'components/Loader'
import { Box } from 'nft/components/Box'
import { Column } from 'nft/components/Flex'
import { CloseDropDownIcon } from 'nft/components/icons'
import { bodySmall, buttonMedium, headlineSmall } from 'nft/css/common.css'
import { useBag, useIsMobile, useSellAsset, useSellPageState } from 'nft/hooks'
import { SellPageStateType } from 'nft/types'
import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'

import * as styles from './ListingTag.css'

const CartSellAssetRow = lazy(() => import('./TagAssetRow'))

const Cart = () => {
  const { pathname } = useLocation()
  const isNFTSellPage = pathname.startsWith('/nfts/sell')
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
      display={bagExpanded && isNFTSellPage ? 'flex' : 'none'}
    >
      <Suspense fallback={<Loader />}>
        <Column
          marginTop={{ sm: '0', md: '4' }}
          marginRight={{ sm: '0', md: '20' }}
          className={styles.tagContainer}
          width={{ sm: 'full', md: '288' }}
          height={{ sm: 'full', md: 'auto' }}
          backgroundColor="white"
          marginLeft="0"
          justifyContent="flex-start"
        >
          {sellPageState === SellPageStateType.LISTING ? null : (
            <>
              <BagHeader bagQuantity={sellAssets.length} />
              <Column
                overflowX="hidden"
                overflowY="auto"
                position="relative"
                paddingTop="6"
                paddingBottom="6"
                height="full"
                className={styles.tagAssets}
              >
                {sellAssets.length
                  ? sellAssets.map((asset, index) => <CartSellAssetRow asset={asset} key={index} />)
                  : null}
              </Column>
              <Box padding="12">
                <Box
                  as="button"
                  className={`${buttonMedium} ${styles.orderButton}`}
                  disabled={sellAssets.length === 0}
                  onClick={() => {
                    isMobile && toggleCart()
                    setSellPageState(SellPageStateType.LISTING)
                  }}
                >
                  Continue
                </Box>
              </Box>
            </>
          )}
        </Column>
      </Suspense>
    </Box>
  )
}

const BagHeader = ({ bagQuantity }: { bagQuantity: number }) => {
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
        {'Selected items'}
      </Box>
      {bagQuantity > 0 ? (
        <Box className={bodySmall} paddingTop="0" paddingBottom="8" paddingX="0" marginY="0" marginX="auto">
          {bagQuantity} {bagQuantity === 1 ? 'NFT' : 'NFTs'}
          <Box as="span" position="relative" paddingRight="2" paddingLeft="4" style={{ fontSize: '8px', top: '-2px' }}>
            &#x2022;
          </Box>
          <Box as="span" color="blue400" onClick={resetSellAssets} cursor="pointer" paddingLeft="2">
            Remove all
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

export default Cart
