import { useWeb3React } from '@web3-react/core'
import { useEffect } from 'react'

import { useSupportedChainId } from 'constants/chains'
import { useRemovePopup } from '../../state/application/hooks'
import { PopupContent, PopupType } from '../../state/application/reducer'
import { FailedNetworkSwitchPopup, TransactionPopupContent, UniswapXOrderPopupContent } from './PopupContent'

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
    if (removeAfterMs === null) return undefined

    const timeout = setTimeout(() => {
      removePopup(popKey)
    }, removeAfterMs)

    return () => {
      clearTimeout(timeout)
    }
  }, [popKey, removeAfterMs, removePopup])

  const { chainId } = useWeb3React()
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
