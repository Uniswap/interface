import { BaseButton } from 'components/Button'
import { useIsMobile } from 'hooks/screenSize'
import { Plural, Trans, t } from 'i18n'
import styled from 'lib/styled-components'
import { BelowFloorWarningModal } from 'nft/components/profile/list/Modal/BelowFloorWarningModal'
import { findListingIssues } from 'nft/components/profile/list/utils'
import { useSellAsset } from 'nft/hooks'
import { useMemo, useState } from 'react'
import { BREAKPOINTS } from 'theme'

const StyledListingButton = styled(BaseButton)<{ showResolveIssues: boolean; missingPrices: boolean }>`
  background: ${({ showResolveIssues, theme }) => (showResolveIssues ? theme.critical : theme.accent1)};
  color: ${({ theme }) => theme.deprecated_accentTextLightPrimary};
  font-weight: 535;
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
    if ((missingExpiration || overMaxExpiration || listingsAboveSellOrderFloor.length) && !showResolveIssues) {
      toggleShowResolveIssues()
    }

    return [listingsMissingPrice, listingsBelowFloor]
  }, [sellAssets, setIssues, showResolveIssues, toggleShowResolveIssues])

  const warningWrappedClick = () => {
    if (issues) {
      !showResolveIssues && toggleShowResolveIssues()
    } else if (listingsBelowFloor.length) {
      setShowWarning(true)
    } else {
      onClick()
    }
  }

  return (
    <>
      <StyledListingButton
        onClick={warningWrappedClick}
        missingPrices={!!listingsMissingPrice.length}
        showResolveIssues={showResolveIssues}
      >
        {showResolveIssues ? (
          <Plural
            value={issues !== 1 ? 2 : 1}
            one={t('common.resolveIssue')}
            other={t('common.resolveIssues', { issues })}
          />
        ) : listingsMissingPrice.length && !isMobile ? (
          <Trans i18nKey="nft.setPrices" />
        ) : (
          <Trans i18nKey="nft.startListing" />
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
