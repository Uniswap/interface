import {
  CancelLimitsDialog,
  CancellationState,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelLimitsDialog'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { useCancelMultipleOrdersCallback } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { LimitDetailActivityRow } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitDetailActivityRow'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import { Plural, Trans, t } from 'i18n'
import { useMemo, useState } from 'react'
import { UniswapXOrderDetails } from 'state/signatures/types'
import styled from 'styled-components'
import { UniswapXOrderStatus } from 'types/uniswapx'

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

  return (
    <SlideOutMenu title={<Trans>Open limits</Trans>} onClose={onClose}>
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
        {Boolean(selectedOrders.filter((order) => order.status === UniswapXOrderStatus.OPEN).length) && (
          <StyledCancelButton
            emphasis={ButtonEmphasis.medium}
            onClick={() => setCancelState(CancellationState.REVIEWING_CANCELLATION)}
            size={ButtonSize.medium}
            disabled={cancelState !== CancellationState.NOT_STARTED || selectedOrders.length === 0}
          >
            <Plural
              value={selectedOrders.length}
              one={t`Cancel limit`}
              other={t(`Cancel {{count}} limits`, { count: selectedOrders.length })}
            />
          </StyledCancelButton>
        )}
      </Container>
      <CancelLimitsDialog
        isVisible={cancelState !== CancellationState.NOT_STARTED}
        orders={selectedOrders}
        onCancel={() => setCancelState(CancellationState.NOT_STARTED)}
        onConfirm={async () => {
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
        }}
        cancelState={cancelState}
        cancelTxHash={cancelTxHash}
      />
    </SlideOutMenu>
  )
}
