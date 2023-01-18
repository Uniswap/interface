import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import { NftListV2Variant, useNftListV2Flag } from 'featureFlags/flags/nftListV2'
import { Center, Column } from 'nft/components/Flex'
import { ListPage } from 'nft/components/profile/list/ListPage'
import { ProfilePage } from 'nft/components/profile/view/ProfilePage'
import { ProfilePageLoadingSkeleton } from 'nft/components/profile/view/ProfilePageLoadingSkeleton'
import { useBag, useNFTList, useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { ListingStatus, ProfilePageStateType } from 'nft/types'
import { Suspense, useEffect, useRef } from 'react'
import { useToggleWalletModal } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

import * as styles from './profile.css'
import { LIST_PAGE_MARGIN } from './shared'

const SHOPPING_BAG_WIDTH = 360

const ProfilePageWrapper = styled.div`
  height: 100%;
  width: 100%;
  scrollbar-width: none;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    height: auto;
  }
`

const LoadedAccountPage = styled.div<{ pageWidthAdjustment: number; isNftListV2: boolean }>`
  width: ${({ pageWidthAdjustment }) => `calc(100% - ${pageWidthAdjustment}px)`};
  margin: ${({ isNftListV2 }) => (isNftListV2 ? `0px ${LIST_PAGE_MARGIN}px` : 'unset')};
`

const ConnectWalletButton = styled(ButtonPrimary)`
  width: min-content;
  white-space: nowrap;
  border-radius: 12px;
  padding: 14px 18px;
  border: none;
`

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

  const pageWidthAdjustment =
    cartExpanded && (!isNftListV2 || sellPageState === ProfilePageStateType.VIEWING)
      ? SHOPPING_BAG_WIDTH
      : isNftListV2 && sellPageState !== ProfilePageStateType.VIEWING
      ? LIST_PAGE_MARGIN * 2
      : 0

  return (
    <Trace page={InterfacePageName.NFT_PROFILE_PAGE} shouldLogImpression>
      <ProfilePageWrapper>
        {/* <Head> TODO: figure out metadata tagging
          <title>Genie | Sell</title>
        </Head> */}
        {account ? (
          <LoadedAccountPage pageWidthAdjustment={pageWidthAdjustment} isNftListV2={isNftListV2}>
            {sellPageState === ProfilePageStateType.VIEWING ? <ProfilePage /> : <ListPage />}
          </LoadedAccountPage>
        ) : (
          <Column as="section" gap="60" className={styles.section}>
            <div style={{ minHeight: '70vh' }}>
              <Center className={styles.notConnected} flexDirection="column">
                <ThemedText.HeadlineMedium lineHeight="36px" color="textSecondary" fontWeight="600" marginBottom="24px">
                  No items to display
                </ThemedText.HeadlineMedium>
                <ConnectWalletButton onClick={toggleWalletModal}>
                  <ThemedText.SubHeader lineHeight="20px">Connect Wallet</ThemedText.SubHeader>
                </ConnectWalletButton>
              </Center>
            </div>
          </Column>
        )}
      </ProfilePageWrapper>
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
