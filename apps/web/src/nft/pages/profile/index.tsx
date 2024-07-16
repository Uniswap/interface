import { InterfacePageName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonPrimary } from 'components/Button'
import { useAccount } from 'hooks/useAccount'
import useENSName from 'hooks/useENSName'
import { Trans, t } from 'i18n'
import styled from 'lib/styled-components'
import { XXXL_BAG_WIDTH } from 'nft/components/bag/Bag'
import { ListPage } from 'nft/components/profile/list/ListPage'
import { ProfilePage } from 'nft/components/profile/view/ProfilePage'
import { useBag, useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { LIST_PAGE_MARGIN, LIST_PAGE_MARGIN_MOBILE } from 'nft/pages/profile/shared'
import { ProfilePageStateType } from 'nft/types'
import { useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { shortenAddress } from 'utilities/src/addresses'

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

function getProfilePageTitle(account: string | undefined, ENSName: string | null | undefined): string {
  if (!account) {
    return t('nft.collectionOnUni')
  }

  if (!ENSName) {
    return t(`nft.collectonOnAddress`, {
      address: shortenAddress(account),
    })
  }

  return t(`nft.authorsCollectionOnUni`, {
    name: ENSName,
  })
}

export default function Profile() {
  const sellPageState = useProfilePageState((state) => state.state)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)

  const account = useAccount()
  const { ENSName } = useENSName(account.address)
  const accountRef = useRef(account.address)
  const accountDrawer = useAccountDrawer()

  useEffect(() => {
    if (accountRef.current !== account.address) {
      accountRef.current = account.address
      resetSellAssets()
      setSellPageState(ProfilePageStateType.VIEWING)
      clearCollectionFilters()
    }
  }, [account.address, resetSellAssets, setSellPageState, clearCollectionFilters])
  const cartExpanded = useBag((state) => state.bagExpanded)
  const isListingNfts = sellPageState === ProfilePageStateType.LISTING

  return (
    <>
      <Helmet>
        <title>{getProfilePageTitle(account.address, ENSName)}</title>
      </Helmet>
      <Trace logImpression page={InterfacePageName.NFT_PROFILE_PAGE}>
        <ProfilePageWrapper>
          {account.isConnected ? (
            <LoadedAccountPage cartExpanded={cartExpanded} isListingNfts={isListingNfts}>
              {!isListingNfts ? <ProfilePage /> : <ListPage />}
            </LoadedAccountPage>
          ) : (
            <Center>
              <ThemedText.HeadlineMedium lineHeight="36px" color="neutral2" fontWeight="535" marginBottom="24px">
                <Trans i18nKey="nft.noItems" />
              </ThemedText.HeadlineMedium>
              <ConnectWalletButton onClick={accountDrawer.open}>
                <ThemedText.SubHeader color="white" lineHeight="20px">
                  <Trans i18nKey="common.connectWallet.button" />
                </ThemedText.SubHeader>
              </ConnectWalletButton>
            </Center>
          )}
        </ProfilePageWrapper>
      </Trace>
    </>
  )
}
