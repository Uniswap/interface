import { Plural, t, Trans } from '@lingui/macro'
import { BaseButton } from 'components/Button'
import { BelowFloorWarningModal } from 'nft/components/profile/list/Modal/BelowFloorWarningModal'
import { useIsMobile, useSellAsset } from 'nft/hooks'
import { useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { shallow } from 'zustand/shallow'

import { findListingIssues } from './utils'

const StyledListingButton = styled(BaseButton)<{ showResolveIssues: boolean; missingPrices: boolean }>`
  background: ${({ showResolveIssues, theme }) => (showResolveIssues ? theme.accentFailure : theme.accentAction)};
  color: ${({ theme }) => theme.accentTextLightPrimary};
  font-weight: 600;
  font-size: 20px;
  line-height: 24px;
  padding: 16px;
  border-radius: 12px;
  width: min-content;
  border: none;
  cursor: ${({ missingPrices }) => (missingPrices ? 'auto' : 'pointer')};
  opacity: ${({ showResolveIssues, missingPrices }) => !showResolveIssues && missingPrices && '0.3'};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    font-size: 16px;
    line-height: 20px;
    padding: 10px 12px;
  }
`

export const ListingButton = ({ onClick }: { onClick: () => void }) => {
  const { sellAssets, showResolveIssues, toggleShowResolveIssues, issues, setIssues } = useSellAsset(
    ({ sellAssets, showResolveIssues, toggleShowResolveIssues, issues, setIssues }) => ({
      sellAssets,
      showResolveIssues,
      toggleShowResolveIssues,
      issues,
      setIssues,
    }),
    shallow
  )
  const [showWarning, setShowWarning] = useState(false)
  const isMobile = useIsMobile()

  // Find issues with item listing data
  const [listingsMissingPrice, listingsBelowFloor] = useMemo(() => {
    const {
      missingExpiration,
      overMaxExpiration,
      listingsMissingPrice,
      listingsBelowFloor,
      listingsAboveSellOrderFloor,
    } = findListingIssues(sellAssets)

    // set number of issues
    const foundIssues =
      Number(missingExpiration) +
      Number(overMaxExpiration) +
      listingsMissingPrice.length +
      listingsAboveSellOrderFloor.length
    setIssues(foundIssues)
    !foundIssues && showResolveIssues && toggleShowResolveIssues()
    // Only show Resolve Issue text if there was a user submitted error (ie not when page loads with no prices set)
    if ((missingExpiration || overMaxExpiration || listingsAboveSellOrderFloor.length) && !showResolveIssues)
      toggleShowResolveIssues()

    return [listingsMissingPrice, listingsBelowFloor]
  }, [sellAssets, setIssues, showResolveIssues, toggleShowResolveIssues])

  const warningWrappedClick = () => {
    if (issues) !showResolveIssues && toggleShowResolveIssues()
    else if (listingsBelowFloor.length) setShowWarning(true)
    else onClick()
  }

  return (
    <>
      <StyledListingButton
        onClick={warningWrappedClick}
        missingPrices={!!listingsMissingPrice.length}
        showResolveIssues={showResolveIssues}
      >
        {showResolveIssues ? (
          <Plural value={issues !== 1 ? 2 : 1} _1="Resolve issue" other={t`Resolve ${issues} issues`} />
        ) : listingsMissingPrice.length && !isMobile ? (
          <Trans>Set prices to continue</Trans>
        ) : (
          <Trans>Start listing</Trans>
        )}
      </StyledListingButton>

      {showWarning && (
        <BelowFloorWarningModal
          listingsBelowFloor={listingsBelowFloor}
          closeModal={() => setShowWarning(false)}
          startListing={onClick}
        />
      )}
    </>
  )
}
