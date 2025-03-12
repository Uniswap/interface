import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { BelowFloorWarningModal } from 'nft/components/profile/list/Modal/BelowFloorWarningModal'
import { findListingIssues } from 'nft/components/profile/list/utils'
import { useSellAsset } from 'nft/hooks'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'

export const ListingButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation()
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

  const missingPrices = !!listingsMissingPrice.length

  return (
    <>
      <Button
        fill={false}
        cursor={missingPrices ? 'auto' : 'pointer'}
        opacity={!showResolveIssues && missingPrices ? 0.3 : 1}
        variant={showResolveIssues ? 'critical' : 'branded'}
        onPress={warningWrappedClick}
      >
        {showResolveIssues
          ? t('common.resolveIssues', { count: issues })
          : listingsMissingPrice.length && !isMobile
            ? t('nft.setPrices')
            : t('nft.startListing')}
      </Button>

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
