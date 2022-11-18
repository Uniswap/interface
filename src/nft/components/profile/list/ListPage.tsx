import { ListingButton } from 'nft/components/bag/profile/ListingButton'
import { getListingState } from 'nft/components/bag/profile/utils'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { BackArrowIcon } from 'nft/components/icons'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useNFTList, useProfilePageState, useSellAsset } from 'nft/hooks'
import { ListingStatus, ProfilePageStateType } from 'nft/types'
import { ListingMarkets } from 'nft/utils/listNfts'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import { NFTListingsGrid } from './NFTListingsGrid'
import { SelectMarketplacesDropdown } from './SelectMarketplacesDropdown'
import { SetDurationModal } from './SetDurationModal'

const MarketWrap = styled.section`
  gap: 48px;
  padding-left: 18px;
  padding-right: 48x;
  margin-left: auto;
  margin-right: auto;
  max-width: 1200px;
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
    <Column display="flex" flexWrap="nowrap">
      <Column marginLeft="14" display="flex">
        <Box
          aria-label="Back"
          as="button"
          border="none"
          onClick={() => setSellPageState(ProfilePageStateType.VIEWING)}
          type="button"
          backgroundColor="transparent"
          cursor="pointer"
          width="min"
        >
          <BackArrowIcon fill={themeVars.colors.textSecondary} />
        </Box>
      </Column>
      <MarketWrap>
        <Row flexWrap={{ sm: 'wrap', lg: 'nowrap' }}>
          <SelectMarketplacesDropdown setSelectedMarkets={setSelectedMarkets} selectedMarkets={selectedMarkets} />
          <SetDurationModal />
        </Row>
        <NFTListingsGrid selectedMarkets={selectedMarkets} />
      </MarketWrap>
      <Box display={{ sm: 'flex', md: 'none' }} marginTop="14" marginX="16" marginBottom="32">
        <ListingButton onClick={toggleBag} buttonText="Continue listing" />
      </Box>
    </Column>
  )
}
