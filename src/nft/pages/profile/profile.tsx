import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { NftListV2Variant, useNftListV2Flag } from 'featureFlags/flags/nftListV2'
import { Box } from 'nft/components/Box'
import { Center, Column } from 'nft/components/Flex'
import { ListPage } from 'nft/components/profile/list/ListPage'
import { ProfilePage } from 'nft/components/profile/view/ProfilePage'
import { ProfilePageLoadingSkeleton } from 'nft/components/profile/view/ProfilePageLoadingSkeleton'
import { buttonMedium, headlineMedium } from 'nft/css/common.css'
import { useBag, useNFTList, useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { ListingStatus, ProfilePageStateType } from 'nft/types'
import { Suspense, useEffect, useRef } from 'react'
import { useToggleWalletModal } from 'state/application/hooks'

import * as styles from './profile.css'

export const LIST_PAGE_MARGIN = 156

const SHOPPING_BAG_WIDTH = 360

const ProfileContent = () => {
  const sellPageState = useProfilePageState((state) => state.state)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const removeAllMarketplaceWarnings = useSellAsset((state) => state.removeAllMarketplaceWarnings)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)
  const setListingStatus = useNFTList((state) => state.setListingStatus)

  useEffect(() => {
    removeAllMarketplaceWarnings()
    setListingStatus(ListingStatus.DEFINED)
  }, [removeAllMarketplaceWarnings, sellPageState, setListingStatus])

  const { account } = useWeb3React()
  const accountRef = useRef(account)
  const toggleWalletModal = useToggleWalletModal()

  useEffect(() => {
    if (accountRef.current !== account) {
      accountRef.current = account
      resetSellAssets()
      setSellPageState(ProfilePageStateType.VIEWING)
      clearCollectionFilters()
    }
  }, [account, resetSellAssets, setSellPageState, clearCollectionFilters])
  const cartExpanded = useBag((state) => state.bagExpanded)
  const isNftListV2 = useNftListV2Flag() === NftListV2Variant.Enabled

  return (
    <Trace page={InterfacePageName.NFT_PROFILE_PAGE} shouldLogImpression>
      <Box className={styles.profileWrapper}>
        {/* <Head> TODO: figure out metadata tagging
          <title>Genie | Sell</title>
        </Head> */}
        {account ? (
          <Box
            style={{
              width: `calc(100% - ${
                cartExpanded && (!isNftListV2 || sellPageState === ProfilePageStateType.VIEWING)
                  ? SHOPPING_BAG_WIDTH
                  : isNftListV2
                  ? LIST_PAGE_MARGIN * 2
                  : 0
              }px)`,
              margin: isNftListV2 ? `0px ${LIST_PAGE_MARGIN}px` : 'unset',
            }}
          >
            {sellPageState === ProfilePageStateType.VIEWING ? <ProfilePage /> : <ListPage />}
          </Box>
        ) : (
          <Column as="section" gap="60" className={styles.section}>
            <div style={{ minHeight: '70vh' }}>
              <Center className={styles.notConnected} flexDirection="column">
                <Box as="span" className={headlineMedium} color="textSecondary" marginBottom="24" display="block">
                  No items to display
                </Box>
                <Box as="button" className={buttonMedium} onClick={toggleWalletModal}>
                  Connect Wallet
                </Box>
              </Center>
            </div>
          </Column>
        )}
      </Box>
    </Trace>
  )
}

const Profile = () => {
  return (
    <Suspense fallback={<ProfilePageLoadingSkeleton />}>
      <ProfileContent />
    </Suspense>
  )
}

export default Profile
