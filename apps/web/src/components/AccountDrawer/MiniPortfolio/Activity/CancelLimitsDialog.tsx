import { Plural, Trans } from '@lingui/macro'
import { Dialog, DialogButtonType, DialogProps } from 'components/Dialog/Dialog'
import { Slash } from 'react-feather'
import { UniswapXOrderDetails } from 'state/signatures/types'

export enum CancellationState {
  NOT_STARTED = 'not_started',
  REVIEWING_CANCELLATION = 'reviewing_cancellation',
  CANCELLING = 'cancelling',
}

type CancelLimitsDialogProps = Partial<Omit<DialogProps, 'isVisible' | 'onCancel'>> &
  Pick<DialogProps, 'isVisible' | 'onCancel'>

export function CancelLimitsDialog(
  props: CancelLimitsDialogProps & {
    orders: UniswapXOrderDetails[]
    cancelling: boolean
    onConfirm: () => void
  }
) {
  const { orders, cancelling, onConfirm, onCancel } = props
  return (
    <Dialog
      {...props}
      icon={<Slash size={28} />}
      title={
        <Plural id="cancelling" value={orders.length} one="Cancel limit" other={`Cancel ${orders.length} limits`} />
      }
      description={
        <Plural
          id="cancelling-confirmation"
          value={orders.length}
          one="Are you sure you want to cancel your limit before it executes or expires?"
          other="Are you sure you want to cancel your limits before they execute or expire?"
        />
      }
      buttonsConfig={{
        left: {
          title: <Trans>Nevermind</Trans>,
          onClick: onCancel,
        },
        right: {
          title: <Trans>Proceed</Trans>,
          onClick: onConfirm,
          type: DialogButtonType.Error,
          disabled: cancelling,
        },
      }}
    />
  )
}
