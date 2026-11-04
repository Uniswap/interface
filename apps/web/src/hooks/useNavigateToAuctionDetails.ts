import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { getAuctionDetailsURL } from '~/utils/auctionDetailsUrl'
import { POPUP_MEDIUM_DISMISS_MS } from '~/utils/popups/constants'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

type AuctionDetailsNavigationInput = Parameters<typeof getAuctionDetailsURL>[0]

/** The toast every auction entry point shows when no details page can be addressed. */
export function showAuctionOpenFailedPopup(t: TFunction): void {
  popupRegistry.addPopup(
    { type: PopupType.Error, error: t('notification.auction.open.failed') },
    'auction-navigation-error',
    POPUP_MEDIUM_DISMISS_MS,
  )
}

export function useNavigateToAuctionDetails(): (args: AuctionDetailsNavigationInput) => void {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useEvent((args: AuctionDetailsNavigationInput) => {
    const url = getAuctionDetailsURL(args)
    if (url) {
      navigate(url)
      return
    }

    logger.warn('useNavigateToAuctionDetails', 'navigateToAuctionDetails', 'Cannot navigate to auction details', args)
    showAuctionOpenFailedPopup(t)
  })
}
