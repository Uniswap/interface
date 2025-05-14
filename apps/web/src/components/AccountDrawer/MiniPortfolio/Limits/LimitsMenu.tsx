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
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import { useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { UniswapXOrderDetails } from 'state/signatures/types'
import { Button, Flex } from 'ui/src'

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
    setSelectedOrdersByHash((prevSelectedOrders) => {
      const newSelectedOrders = { ...prevSelectedOrders }
      if (order.hash in prevSelectedOrders) {
        delete newSelectedOrders[order.hash]
      } else if (order.offchainOrderDetails) {
        newSelectedOrders[order.hash] = order.offchainOrderDetails
      }
      return newSelectedOrders
    })
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
      <LimitDisclaimer mb={24} />
      <Flex height="100%" data-testid="LimitsMenuContainer" gap="$gap16">
        {openLimitOrders.map((order) => (
          <LimitDetailActivityRow
            key={order.hash}
            order={order}
            selected={order.hash in selectedOrdersByHash}
            onToggleSelect={toggleOrderSelection}
          />
        ))}
        {Boolean(selectedOrders.filter((order) => isLimitCancellable(order)).length) && (
          <Flex row>
            <Button
              mt="spacing24"
              emphasis="secondary"
              onPress={() => setCancelState(CancellationState.REVIEWING_CANCELLATION)}
              size="small"
              isDisabled={cancelState !== CancellationState.NOT_STARTED || selectedOrders.length === 0}
            >
              {t('common.limit.cancel', { count: selectedOrders.length })}
            </Button>
          </Flex>
        )}
      </Flex>
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
