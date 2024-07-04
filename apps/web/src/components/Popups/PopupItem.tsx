import {
  FailedNetworkSwitchPopup,
  TransactionPopupContent,
  UniswapXOrderPopupContent,
} from 'components/Popups/PopupContent'
import { useSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useEffect } from 'react'
import { useRemovePopup } from 'state/application/hooks'
import { PopupContent, PopupType } from 'state/application/reducer'

export default function PopupItem({
  removeAfterMs,
  content,
  popKey,
}: {
  removeAfterMs: number | null
  content: PopupContent
  popKey: string
}) {
  const removePopup = useRemovePopup()
  const onClose = () => removePopup(popKey)

  useEffect(() => {
    if (removeAfterMs === null) {
      return undefined
    }

    const timeout = setTimeout(() => {
      removePopup(popKey)
    }, removeAfterMs)

    return () => {
      clearTimeout(timeout)
    }
  }, [popKey, removeAfterMs, removePopup])

  const { chainId } = useAccount()
  const supportedChainId = useSupportedChainId(chainId)

  switch (content.type) {
    case PopupType.Transaction: {
      return supportedChainId ? (
        <TransactionPopupContent hash={content.hash} chainId={supportedChainId} onClose={onClose} />
      ) : null
    }
    case PopupType.Order: {
      return <UniswapXOrderPopupContent orderHash={content.orderHash} onClose={onClose} />
    }
    case PopupType.FailedSwitchNetwork: {
      return <FailedNetworkSwitchPopup chainId={content.failedSwitchNetwork} onClose={onClose} />
    }
  }
}
