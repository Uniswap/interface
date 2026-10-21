import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { MarginAddModal } from '~/pages/Swap/Margin/components/MarginAddModal'
import { MarginAdjustPositionModal } from '~/pages/Swap/Margin/components/MarginAdjustPositionModal'
import { MarginChangeLeverageModal } from '~/pages/Swap/Margin/components/MarginChangeLeverageModal'
import { MarginCloseModal } from '~/pages/Swap/Margin/components/MarginCloseModal'
import { MarginWithdrawModal } from '~/pages/Swap/Margin/components/MarginWithdrawModal'
import type { MarginMarketResolver } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import { marginPositionTokens, marginPositionVenue } from '~/pages/Swap/Margin/marginPositionRow'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

// Renders the expanded-row action modal for the current request. Re-resolves the LATEST position object
// (and its market) from query data by positionId every render, so values stay fresh across polls; if the
// position disappears (closed elsewhere) or its market can't be resolved it self-closes via onClose,
// since the render guard below would otherwise strand the request with nothing to dismiss. A toast
// surfaces the closure so it doesn't read as the action silently doing nothing.
export function MarginActionModals({
  request,
  positions,
  resolveMarket,
  onClose,
}: {
  request: { action: MarginManageAction; positionId: string } | null
  positions: MarginActivePosition[] | undefined
  resolveMarket: MarginMarketResolver
  onClose: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const position = request ? positions?.find((row) => row.positionId === request.positionId) : undefined
  const market = position
    ? resolveMarket({
        ...marginPositionTokens(position),
        venue: marginPositionVenue(position),
        direction: position.direction,
      })
    : undefined

  useEffect(() => {
    if (request && positions && (!position || !market)) {
      popupRegistry.addPopup(
        { type: PopupType.Error, error: t('margin.toast.positionUnavailable') },
        `margin-action-unavailable-${request.positionId}`,
      )
      onClose()
    }
  }, [request, positions, position, market, onClose, t])

  if (!request || !position || !market) {
    return null
  }
  const modalProps = { position, market, isOpen: true as const, onClose }
  // Exhaustive: an unhandled action must render nothing, never fall through to Close.
  switch (request.action) {
    case 'add':
      return <MarginAddModal {...modalProps} />
    case 'withdraw':
      return <MarginWithdrawModal {...modalProps} />
    case 'leverage':
      return <MarginChangeLeverageModal {...modalProps} />
    case 'adjust':
      return <MarginAdjustPositionModal {...modalProps} />
    case 'close':
      return <MarginCloseModal {...modalProps} />
    // Required by type-aware consistent-return, which only runs in the full `check` target.
    default:
      return null
  }
}
