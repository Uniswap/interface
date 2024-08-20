import {
  FailedNetworkSwitchPopup,
  TransactionPopupContent,
  UniswapXOrderPopupContent,
} from 'components/Popups/PopupContent'
import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { useSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useEffect } from 'react'
import { useRemovePopup } from 'state/application/hooks'
import { PopupContent, PopupType } from 'state/application/reducer'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { t } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { SwapTab } from 'uniswap/src/types/screens/interface'

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
    case PopupType.SwitchNetwork: {
      return (
        <ToastRegularSimple onDismiss={onClose}>
          <NetworkLogo chainId={content.chainId} />{' '}
          {getSwitchNetworkTitle(content.action, content.chainId as UniverseChainId)}
        </ToastRegularSimple>
      )
    }
  }
}

function getSwitchNetworkTitle(action: SwapTab, chainId: UniverseChainId) {
  const { label } = UNIVERSE_CHAIN_INFO[chainId]

  switch (action) {
    case SwapTab.Swap:
      return t('notification.swap.network', { network: label })
    case SwapTab.Send:
      return t('notification.send.network', { network: label })
    default:
      return null
  }
}
