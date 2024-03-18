import { Plural, Trans } from '@lingui/macro'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent } from 'analytics'
import {
  CancelLimitsDialog,
  CancellationState,
} from 'components/AccountDrawer/MiniPortfolio/Activity/CancelLimitsDialog'
import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { cancelMultipleUniswapXOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { LimitDetailActivityRow } from 'components/AccountDrawer/MiniPortfolio/Limits/LimitDetailActivityRow'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import { ContractTransaction } from 'ethers/lib/ethers'
import { useContract } from 'hooks/useContract'
import { useCallback, useMemo, useState } from 'react'
import { UniswapXOrderDetails } from 'state/signatures/types'
import styled from 'styled-components'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types/Permit2'

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

function useCancelMultipleOrders(orders?: UniswapXOrderDetails[]): () => Promise<ContractTransaction[] | undefined> {
  const { provider } = useWeb3React()
  const permit2 = useContract<Permit2>(PERMIT2_ADDRESS, PERMIT2_ABI, true)
  return useCallback(async () => {
    if (!orders || orders.length === 0) return undefined

    sendAnalyticsEvent('UniswapX Order Cancel Initiated', {
      orders: orders.map((order) => order.orderHash),
    })

    return cancelMultipleUniswapXOrders({
      encodedOrders: orders.map((order) => order.encodedOrder as string),
      permit2,
      provider,
      chainId: orders?.[0].chainId,
    })
  }, [orders, permit2, provider])
}

export function LimitsMenu({ onClose, account }: { account: string; onClose: () => void }) {
  const { openLimitOrders } = useOpenLimitOrders(account)
  const [selectedOrdersByHash, setSelectedOrdersByHash] = useState<Record<string, UniswapXOrderDetails>>({})
  const [cancelState, setCancelState] = useState(CancellationState.NOT_STARTED)
  const [cancelTxHash, setCancelTxHash] = useState<string | undefined>()

  const selectedOrders = useMemo(() => {
    return Object.values(selectedOrdersByHash)
  }, [selectedOrdersByHash])

  const cancelOrders = useCancelMultipleOrders(selectedOrders)

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
        {Boolean(Object.keys(selectedOrdersByHash).length) && (
          <StyledCancelButton
            emphasis={ButtonEmphasis.medium}
            onClick={() => setCancelState(CancellationState.REVIEWING_CANCELLATION)}
            size={ButtonSize.medium}
            disabled={cancelState !== CancellationState.NOT_STARTED || selectedOrders.length === 0}
          >
            <Plural
              id="cancelling"
              value={selectedOrders.length}
              one="Cancel limit"
              other={`Cancel ${selectedOrders.length} limits`}
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
