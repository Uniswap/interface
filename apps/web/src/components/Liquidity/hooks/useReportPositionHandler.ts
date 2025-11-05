import { PositionInfo } from 'components/Liquidity/types'
import { POPUP_MEDIUM_DISMISS_MS } from 'components/Popups/constants'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useAppDispatch } from 'state/hooks'
import { submitPoolSpamReport } from 'uniswap/src/features/reporting/reports'
import { setPositionVisibility } from 'uniswap/src/features/visibility/slice'
import { useEvent } from 'utilities/src/react/hooks'

export function useReportPositionHandler({
  position,
  isVisible,
  navigateToPositions = false,
}: {
  position: PositionInfo | undefined
  isVisible: boolean
  navigateToPositions?: boolean
}): () => void {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useEvent(() => {
    if (!position) {
      return
    }

    // Submit report
    submitPoolSpamReport({
      chainId: position.chainId,
      poolId: position.poolId,
      version: position.version,
      token0: position.currency0Amount.currency,
      token1: position.currency1Amount.currency,
    })

    // hide position if not already hidden
    if (isVisible) {
      dispatch(
        setPositionVisibility({
          poolId: position.poolId,
          tokenId: position.tokenId,
          chainId: position.chainId,
          isVisible: false,
        }),
      )
    }

    // pop reported toast
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-position-success',
      POPUP_MEDIUM_DISMISS_MS,
    )

    // navigate to position page
    if (navigateToPositions) {
      navigate('/positions')
    }
  })
}
