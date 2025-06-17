import { SharedEventName } from '@uniswap/analytics-events'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { focusOrCreateUniswapInterfaceTab } from 'src/app/navigation/utils'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'

export function useInterfaceBuyNavigator(element?: ElementName): () => void {
  const { dappUrl } = useDappContext()
  const dappChain = useDappLastChainId(dappUrl)

  return () => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      screen: ExtensionScreens.Home,
      element,
    })
    navigateToInterfaceFiatOnRamp(dappChain)
  }
}

export function navigateToInterfaceFiatOnRamp(chainId?: UniverseChainId): void {
  const chainParam = chainId ? `?chain=${getChainInfo(chainId).urlParam}` : ''
  focusOrCreateUniswapInterfaceTab({
    url: `${uniswapUrls.webInterfaceBuyUrl}${chainParam}`,
  }).catch((err) =>
    logger.error(err, {
      tags: {
        file: 'utils',
        function: 'redirectToInterfaceFiatOnRamp',
      },
    }),
  )
}
