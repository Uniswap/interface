import { SMALL_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { ListingButton } from 'nft/components/bag/profile/ListingButton'
import { getListingState } from 'nft/components/bag/profile/utils'
import { Column, Row } from 'nft/components/Flex'
import { BackArrowIcon } from 'nft/components/icons'
import { headlineLarge, headlineSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useNFTList, useProfilePageState, useSellAsset } from 'nft/hooks'
import { ListingStatus, ProfilePageStateType } from 'nft/types'
import { ListingMarkets } from 'nft/utils/listNfts'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import { NFTListingsGrid } from './NFTListingsGrid'
import { SelectMarketplacesDropdown } from './SelectMarketplacesDropdown'
import { SetDurationModal } from './SetDurationModal'

const MarketWrap = styled.section`
  gap: 48px;
  margin: 0px auto;
  padding: 0px 16px;
  max-width: 1200px;
  width: 100%;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    padding: 0px 44px;
  }
`

const ListingHeader = styled(Row)`
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: 18px;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    margin-top: 40px;
  }
`

const GridWrapper = styled.div`
  margin-top: 24px;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    margin-left: 40px;
  }
`

const MobileListButtonWrapper = styled.div`
  display: flex;
  margin: 14px 16px 32px 16px;

  @media screen and (min-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

export const ListPage = () => {
  const { setProfilePageState: setSellPageState } = useProfilePageState()
  const setGlobalMarketplaces = useSellAsset((state) => state.setGlobalMarketplaces)
  const [selectedMarkets, setSelectedMarkets] = useState([ListingMarkets[0]]) // default marketplace: x2y2
  const toggleBag = useBag((s) => s.toggleBag)
  const listings = useNFTList((state) => state.listings)
  const collectionsRequiringApproval = useNFTList((state) => state.collectionsRequiringApproval)
  const listingStatus = useNFTList((state) => state.listingStatus)
  const setListingStatus = useNFTList((state) => state.setListingStatus)
  const isMobile = useIsMobile()

  useEffect(() => {
    const state = getListingState(collectionsRequiringApproval, listings)

    if (state.allListingsApproved) setListingStatus(ListingStatus.APPROVED)
    else if (state.anyPaused && !state.anyActiveFailures && !state.anyActiveSigning && !state.anyActiveRejections) {
      setListingStatus(ListingStatus.CONTINUE)
    } else if (state.anyPaused) setListingStatus(ListingStatus.PAUSED)
    else if (state.anyActiveSigning) setListingStatus(ListingStatus.SIGNING)
    else if (state.allListingsPending || (state.allCollectionsPending && state.allListingsDefined))
      setListingStatus(ListingStatus.PENDING)
    else if (state.anyActiveFailures && listingStatus !== ListingStatus.PAUSED) setListingStatus(ListingStatus.FAILED)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, collectionsRequiringApproval])

  useEffect(() => {
    setGlobalMarketplaces(selectedMarkets)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkets])

  return (
    <Column>
      <MarketWrap>
        <ListingHeader>
          <Row gap="4" marginBottom={{ sm: '18', md: '0' }}>
            <BackArrowIcon
              height={isMobile ? 20 : 32}
              width={isMobile ? 20 : 32}
              fill={themeVars.colors.textSecondary}
              onClick={() => setSellPageState(ProfilePageStateType.VIEWING)}
              cursor="pointer"
            />
            <div className={isMobile ? headlineSmall : headlineLarge}>Sell NFTs</div>
          </Row>
          <Row gap="12">
            <SelectMarketplacesDropdown setSelectedMarkets={setSelectedMarkets} selectedMarkets={selectedMarkets} />
            <SetDurationModal />
          </Row>
        </ListingHeader>
        <GridWrapper>
          <NFTListingsGrid selectedMarkets={selectedMarkets} />
        </GridWrapper>
      </MarketWrap>
      <MobileListButtonWrapper>
        <ListingButton onClick={toggleBag} buttonText="Continue listing" />
      </MobileListButtonWrapper>
    </Column>
  )
}
