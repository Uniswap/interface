import {
  FailedNetworkSwitchPopup,
  TransactionPopupContent,
  UniswapXOrderPopupContent,
} from 'components/Popups/PopupContent'
import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { PopupContent, PopupType } from 'components/Popups/types'
import { useAccount } from 'hooks/useAccount'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapTab } from 'uniswap/src/types/screens/interface'

export function PopupItem({ content, onClose }: { content: PopupContent; popKey: string; onClose: () => void }) {
  const { t } = useTranslation()

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
        <ToastRegularSimple
          onDismiss={onClose}
          icon={<NetworkLogo chainId={content.chainId} />}
          text={getSwitchNetworkTitle(t, content.action, content.chainId as UniverseChainId)}
        />
      )
    }
    case PopupType.Bridge: {
      return (
        <ToastRegularSimple
          onDismiss={onClose}
          icon={<BridgeToast inputChainId={content.inputChainId} outputChainId={content.outputChainId} />}
        />
      )
    }
  }
}

function getSwitchNetworkTitle(t: TFunction, action: SwapTab, chainId: UniverseChainId) {
  const { label } = getChainInfo(chainId)

  switch (action) {
    case SwapTab.Swap:
      return t('notification.swap.network', { network: label })
    case SwapTab.Send:
      return t('notification.send.network', { network: label })
    default:
      return ''
  }
}

function BridgeToast({
  inputChainId,
  outputChainId,
}: {
  inputChainId: UniverseChainId
  outputChainId: UniverseChainId
}): JSX.Element {
  const originChain = getChainInfo(inputChainId)
  const targetChain = getChainInfo(outputChainId)
  return (
    <Flex row gap="$gap8">
      <Flex row gap="$gap4">
        <NetworkLogo chainId={inputChainId} />
        <Text variant="body2" lineHeight={20}>
          {originChain.label}
        </Text>
      </Flex>
      <Shuffle color="$neutral2" size="$icon.20" />
      <Flex row gap="$gap4">
        <NetworkLogo chainId={outputChainId} />
        <Text variant="body2" lineHeight={20}>
          {targetChain.label}
        </Text>
      </Flex>
    </Flex>
  )
}
