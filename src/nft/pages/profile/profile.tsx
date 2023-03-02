import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import { XXXL_BAG_WIDTH } from 'nft/components/bag/Bag'
import { ListPage } from 'nft/components/profile/list/ListPage'
import { ProfilePage } from 'nft/components/profile/view/ProfilePage'
import { ProfilePageLoadingSkeleton } from 'nft/components/profile/view/ProfilePageLoadingSkeleton'
import { useBag, useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { ProfilePageStateType } from 'nft/types'
import { Suspense, useEffect, useRef } from 'react'
import { useToggleWalletModal } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

import { LIST_PAGE_MARGIN, LIST_PAGE_MARGIN_MOBILE } from './shared'

const ProfilePageWrapper = styled.div`
  height: 100%;
  width: 100%;
  scrollbar-width: none;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    height: auto;
  }
`

const LoadedAccountPage = styled.div<{ cartExpanded: boolean; isListingNfts: boolean }>`
  width: calc(
    100% -
      ${({ cartExpanded, isListingNfts }) =>
        isListingNfts ? LIST_PAGE_MARGIN * 2 : cartExpanded ? XXXL_BAG_WIDTH : 0}px
  );
  margin: 0px ${({ isListingNfts }) => (isListingNfts ? LIST_PAGE_MARGIN : 0)}px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    width: calc(100% - ${({ isListingNfts }) => (isListingNfts ? LIST_PAGE_MARGIN_MOBILE * 2 : 0)}px);
    margin: 0px ${({ isListingNfts }) => (isListingNfts ? LIST_PAGE_MARGIN_MOBILE : 0)}px;
  }
`

const Center = styled.div`
  left: 50%;
  top: 40%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  white-space: nowrap;
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
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)

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
  const isListingNfts = sellPageState === ProfilePageStateType.LISTING

  return (
    <Trace page={InterfacePageName.NFT_PROFILE_PAGE} shouldLogImpression>
      <ProfilePageWrapper>
        {account ? (
          <LoadedAccountPage cartExpanded={cartExpanded} isListingNfts={isListingNfts}>
            {!isListingNfts ? <ProfilePage /> : <ListPage />}
          </LoadedAccountPage>
        ) : (
          <Center>
            <ThemedText.HeadlineMedium lineHeight="36px" color="textSecondary" fontWeight="600" marginBottom="24px">
              <Trans>No items to display</Trans>
            </ThemedText.HeadlineMedium>
            <ConnectWalletButton onClick={toggleWalletModal}>
              <ThemedText.SubHeader color="white" lineHeight="20px">
                <Trans>Connect Wallet</Trans>
              </ThemedText.SubHeader>
            </ConnectWalletButton>
          </Center>
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
