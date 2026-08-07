import { toScreenInput, useIsBlockedAddress } from '@universe/compliance'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsBlockedActiveAddress } from 'wallet/src/features/compliance/hooks'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'

type SendButtonState = {
  isDisabled: boolean
  isActiveBlocked: boolean
  isRecipientBlocked: boolean
}

// Permissioned-token block is folded into `warnings.blockingWarning` upstream.
// Returns block flags alongside the disabled state so callers can render TRM warnings
// without re-subscribing to the same hooks.
export function useIsSendButtonDisabled({
  hasValueGreaterThanZero,
}: {
  hasValueGreaterThanZero: boolean
}): SendButtonState {
  const { warnings, recipient, derivedSendInfo } = useSendContext()
  const { walletNeedsRestore } = useTransactionModalContext()
  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlockedAddress(
    toScreenInput(recipient, derivedSendInfo.chainId),
  )

  const isDisabled =
    !!warnings.blockingWarning ||
    isActiveBlocked ||
    isRecipientBlocked ||
    isActiveBlockedLoading ||
    isRecipientBlockedLoading ||
    walletNeedsRestore ||
    !hasValueGreaterThanZero

  return { isDisabled, isActiveBlocked, isRecipientBlocked }
}
