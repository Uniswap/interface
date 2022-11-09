import { useWeb3React } from '@web3-react/core'
import { Box } from 'nft/components/Box'
import { Center, Column, Row } from 'nft/components/Flex'
import { ChevronLeftIcon, XMarkIcon } from 'nft/components/icons'
import { ListPage } from 'nft/components/profile/list/ListPage'
import { ProfilePage } from 'nft/components/profile/view/ProfilePage'
import { buttonMedium, headlineMedium, headlineSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useNFTList, useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { ListingStatus, ProfilePageStateType } from 'nft/types'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToggleWalletModal } from 'state/application/hooks'

import * as styles from './sell.css'

const SHOPPING_BAG_WIDTH = 360

const Profile = () => {
  const sellPageState = useProfilePageState((state) => state.state)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const removeAllMarketplaceWarnings = useSellAsset((state) => state.removeAllMarketplaceWarnings)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const navigate = useNavigate()

  useEffect(() => {
    removeAllMarketplaceWarnings()
    setListingStatus(ListingStatus.DEFINED)
  }, [removeAllMarketplaceWarnings, sellPageState, setListingStatus])

  const { account } = useWeb3React()
  const toggleWalletModal = useToggleWalletModal()

  useEffect(() => {
    resetSellAssets()
    setSellPageState(ProfilePageStateType.VIEWING)
    clearCollectionFilters()
  }, [account, resetSellAssets, setSellPageState, clearCollectionFilters])
  const cartExpanded = useBag((state) => state.bagExpanded)

  const exitSellFlow = () => {
    navigate(-1)
  }

  return (
    <Box className={styles.mobileSellWrapper}>
      {/* <Head> TODO: figure out metadata tagging
          <title>Genie | Sell</title>
        </Head> */}
      <Row className={styles.mobileSellHeader}>
        {sellPageState === ProfilePageStateType.LISTING && (
          <Box marginRight="4" onClick={() => setSellPageState(ProfilePageStateType.VIEWING)}>
            <ChevronLeftIcon height={28} width={28} />
          </Box>
        )}
        <Box className={headlineSmall} paddingBottom="4" style={{ lineHeight: '28px' }}>
          {sellPageState === ProfilePageStateType.VIEWING ? 'Select NFTs' : 'Create Listing'}
        </Box>
        <Box cursor="pointer" marginLeft="auto" marginRight="0" onClick={exitSellFlow}>
          <XMarkIcon height={28} width={28} fill={themeVars.colors.textPrimary} />
        </Box>
      </Row>
      {account != null ? (
        <Box style={{ width: `calc(100% - ${cartExpanded ? SHOPPING_BAG_WIDTH : 0}px)` }}>
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
  )
}

export default Profile
