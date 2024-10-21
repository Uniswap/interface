import { SharedEventName } from '@uniswap/analytics-events'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { focusOrCreateUniswapInterfaceTab } from 'src/app/navigation/utils'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { ExtensionScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'

export function useInterfaceBuyNavigator(element?: ElementNameType): () => void {
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
  const chainParam = chainId ? `?chain=${UNIVERSE_CHAIN_INFO[chainId].urlParam}` : ''
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
