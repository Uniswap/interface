import {
  CancelOrdersDialog,
  CancellationState,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelOrdersDialog'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import {
  isLimitCancellable,
  useCancelMultipleOrdersCallback,
} from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { LimitDetailActivityRow } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitDetailActivityRow'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button/buttons'
import Column from 'components/deprecated/Column'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import styled from 'lib/styled-components'
import { useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { UniswapXOrderDetails } from 'state/signatures/types'

const Container = styled(Column)`
  height: 100%;
  position: relative;
`

const StyledCancelButton = styled(ThemeButton)`
  bottom: 0;
  width: 100%;
  margin: 24px 0 0;
`

const StyledLimitsDisclaimer = styled(LimitDisclaimer)`
  margin-bottom: 24px;
`

export function LimitsMenu({ onClose, account }: { account: string; onClose: () => void }) {
  const { t } = useTranslation()
  const { openLimitOrders } = useOpenLimitOrders(account)
  const [selectedOrdersByHash, setSelectedOrdersByHash] = useState<Record<string, UniswapXOrderDetails>>({})
  const [cancelState, setCancelState] = useState(CancellationState.NOT_STARTED)
  const [cancelTxHash, setCancelTxHash] = useState<string | undefined>()

  const selectedOrders = useMemo(() => {
    return Object.values(selectedOrdersByHash)
  }, [selectedOrdersByHash])

  const cancelOrders = useCancelMultipleOrdersCallback(selectedOrders)

  const toggleOrderSelection = (order: Activity) => {
    const newSelectedOrders = { ...selectedOrdersByHash }
    if (order.hash in selectedOrdersByHash) {
      delete newSelectedOrders[order.hash]
    } else if (order.offchainOrderDetails) {
      newSelectedOrders[order.hash] = order.offchainOrderDetails
    }
    setSelectedOrdersByHash(newSelectedOrders)
  }

  const handleConfirm = useCallback(async () => {
    setCancelState(CancellationState.PENDING_SIGNATURE)
    const transactions = await cancelOrders()
    if (transactions && transactions.length > 0) {
      setCancelState(CancellationState.PENDING_CONFIRMATION)
      setCancelTxHash(transactions[0].hash)
      await transactions[0].wait(1)
      setCancelState(CancellationState.CANCELLED)
    } else {
      setCancelState(CancellationState.REVIEWING_CANCELLATION)
    }
  }, [cancelOrders])

  return (
    <SlideOutMenu title={<Trans i18nKey="common.limits.open" />} onClose={onClose}>
      <StyledLimitsDisclaimer />
      <Container data-testid="LimitsMenuContainer">
        {openLimitOrders.map((order) => (
          <LimitDetailActivityRow
            key={order.hash}
            order={order}
            selected={order.hash in selectedOrdersByHash}
            onToggleSelect={toggleOrderSelection}
          />
        ))}
        {Boolean(selectedOrders.filter((order) => isLimitCancellable(order)).length) && (
          <StyledCancelButton
            emphasis={ButtonEmphasis.medium}
            onClick={() => setCancelState(CancellationState.REVIEWING_CANCELLATION)}
            size={ButtonSize.medium}
            disabled={cancelState !== CancellationState.NOT_STARTED || selectedOrders.length === 0}
          >
            {t('common.limit.cancel', { count: selectedOrders.length })}
          </StyledCancelButton>
        )}
      </Container>
      <CancelOrdersDialog
        isVisible={cancelState !== CancellationState.NOT_STARTED}
        orders={selectedOrders}
        onCancel={() => {
          // if the cancel was successful clear the selected orders
          if (cancelTxHash) {
            setSelectedOrdersByHash({})
          }
          setCancelState(CancellationState.NOT_STARTED)
        }}
        onConfirm={handleConfirm}
        cancelState={cancelState}
        cancelTxHash={cancelTxHash}
      />
    </SlideOutMenu>
  )
}
