import { InterfacePageName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { useAccount } from 'hooks/useAccount'
import { TFunction } from 'i18next'
import styled from 'lib/styled-components'
import { XXXL_BAG_WIDTH } from 'nft/components/bag/Bag'
import { ListPage } from 'nft/components/profile/list/ListPage'
import { ProfilePage } from 'nft/components/profile/view/ProfilePage'
import { useBag, useProfilePageState, useSellAsset, useWalletCollections } from 'nft/hooks'
import { LIST_PAGE_MARGIN, LIST_PAGE_MARGIN_MOBILE } from 'nft/pages/profile/shared'
import { ProfilePageStateType } from 'nft/types'
import { useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Button } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { useENSName } from 'uniswap/src/features/ens/api'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { shortenAddress } from 'utilities/src/addresses'

const ProfilePageWrapper = styled.div`
  height: 100%;
  width: 100%;
  scrollbar-width: none;

  @media screen and (min-width: ${breakpoints.xl}px) {
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

  @media screen and (max-width: ${breakpoints.md}px) {
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

function getProfilePageTitle(t: TFunction, account: string | undefined, ENSName: string | null | undefined): string {
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
  const { t } = useTranslation()
  const sellPageState = useProfilePageState((state) => state.state)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)

  const account = useAccount()
  const { data: ENSName } = useENSName(account.address)
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
        <title>{getProfilePageTitle(t, account.address, ENSName)}</title>
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
              <Button onPress={accountDrawer.open} variant="branded" fill={false} style={{ whiteSpace: 'nowrap' }}>
                <ConnectWalletButtonText />
              </Button>
            </Center>
          )}
        </ProfilePageWrapper>
      </Trace>
    </>
  )
}
