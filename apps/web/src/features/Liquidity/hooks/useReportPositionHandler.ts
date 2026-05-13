import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useReportPositionAction } from 'uniswap/src/features/positions/hooks/useReportPositionAction'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useEvent } from 'utilities/src/react/hooks'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export function useReportPositionHandler({
  position,
  isVisible,
  navigateToPositions = false,
}: {
  position: PositionInfo | undefined
  isVisible: boolean
  navigateToPositions?: boolean
}): () => void {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const reportAction = useReportPositionAction({
    onSuccess: () => {
      popupRegistry.addPopup(
        { type: PopupType.Success, message: t('common.reported') },
        'report-position-success',
        POPUP_MEDIUM_DISMISS_MS,
      )
      if (navigateToPositions) {
        void navigate('/positions')
      }
    },
  })

  return useEvent(() => {
    if (!position) {
      return
    }
    reportAction({ position, isVisible })
  })
}
