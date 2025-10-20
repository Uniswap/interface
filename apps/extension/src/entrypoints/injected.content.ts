import { JsonRpcProvider } from '@ethersproject/providers'
import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { dappStore } from 'src/app/features/dapp/store'
import { getOrderedConnectedAddresses } from 'src/app/features/dapp/utils'
import { isArcBrowser } from 'src/app/utils/chrome'
import { getIsDefaultProviderFromStorage } from 'src/app/utils/provider'
import { backgroundStore } from 'src/background/backgroundStore'
import {
  contentScriptUtilityMessageChannel,
  externalDappMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import { addWindowMessageListener } from 'src/background/messagePassing/messageUtils'
import {
  AnalyticsLog,
  ContentScriptUtilityMessageType,
  ExtensionToDappRequestType,
} from 'src/background/messagePassing/types/requests'
import { ExtensionEthMethodHandler } from 'src/contentScript/methodHandlers/ExtensionEthMethodHandler'
import { emitAccountsChanged, emitChainChanged } from 'src/contentScript/methodHandlers/emitUtils'
import { ProviderDirectMethodHandler } from 'src/contentScript/methodHandlers/ProviderDirectMethodHandler'
import { UniswapMethodHandler } from 'src/contentScript/methodHandlers/UniswapMethodHandler'
import {
  isDeprecatedMethod,
  isExtensionEthMethod,
  isProviderDirectMethod,
  isUniswapMethod,
  isUnsupportedMethod,
  postDeprecatedMethodError,
  postParsingError,
  postUnknownMethodError,
} from 'src/contentScript/methodHandlers/utils'
import {
  ETH_PROVIDER_CONFIG,
  isValidWindowEthereumConfigRequest,
  isValidWindowEthereumRequest,
  WindowEthereumConfigRequest,
  WindowEthereumRequest,
} from 'src/contentScript/types'
import { logContentScriptError } from 'src/contentScript/utils'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { arraysAreEqual } from 'utilities/src/primitives/array'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { walletContextValue } from 'wallet/src/features/wallet/context'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { ZodError } from 'zod'

function makeInjected(): void {
  // arc styles aren't available on load
  const ARC_STYLE_INJECTION_DELAY = ONE_SECOND_MS

  let _provider: JsonRpcProvider | undefined
  let _chainId: string | undefined
  let connectedAddresses: Address[] | undefined
  const dappUrl = window.origin

  const getChainId = (): string | undefined => {
    const storedChainId = dappStore.getDappInfo(dappUrl)?.lastChainId

    if (_chainId === undefined && storedChainId) {
      _chainId = chainIdToHexadecimalString(storedChainId)
    }

    return _chainId
  }

  const getProvider = (): JsonRpcProvider | undefined => _provider
  const getConnectedAddresses = (): Address[] | undefined => {
    const storedDappInfo = dappStore.getDappInfo(dappUrl)
    const storedConnectedAddresses =
      storedDappInfo &&
      getOrderedConnectedAddresses(storedDappInfo.connectedAccounts, storedDappInfo.activeConnectedAddress)
    return connectedAddresses ?? storedConnectedAddresses
  }

  const setProvider = (newProvider: JsonRpcProvider): void => {
    _provider = newProvider
  }
  const setChainIdAndMaybeEmit = (newChainId: string): void => {
    // Only emit if the chain have changed, and it's not the first time
    if (_chainId !== undefined && _chainId !== newChainId) {
      emitChainChanged(newChainId)
    }
    _chainId = newChainId
  }

  const setConnectedAddressesAndMaybeEmit = (newConnectedAddresses: Address[]): void => {
    // Only emit if the addresses have changed, and it's not the first time
    const normalizedNewAddresses: HexString[] = newConnectedAddresses
      .map((address) => getValidAddress({ address, platform: Platform.EVM }))
      .filter((normalizedAddress): normalizedAddress is HexString => normalizedAddress !== null)

    if (!connectedAddresses || !arraysAreEqual(connectedAddresses, normalizedNewAddresses)) {
      emitAccountsChanged(normalizedNewAddresses)
    }
    connectedAddresses = normalizedNewAddresses
  }

  const extensionEthMethodHandler = new ExtensionEthMethodHandler({
    getChainId,
    getProvider,
    getConnectedAddresses,
    setChainIdAndMaybeEmit,
    setProvider,
    setConnectedAddressesAndMaybeEmit,
  })

  const providerDirectMethodHandler = new ProviderDirectMethodHandler({
    getChainId,
    getProvider,
    getConnectedAddresses,
    setChainIdAndMaybeEmit,
    setProvider,
    setConnectedAddressesAndMaybeEmit,
  })

  const uniswapMethodHandler = new UniswapMethodHandler({
    getChainId,
    getProvider,
    getConnectedAddresses,
    setChainIdAndMaybeEmit,
    setProvider,
    setConnectedAddressesAndMaybeEmit,
  })

  addWindowMessageListener<WindowEthereumRequest>({
    validator: isValidWindowEthereumRequest,
    handler: async (request, source) => {
      logger.debug('injected.ts', 'Request received for method', JSON.stringify(request), _provider)

      if (!backgroundStore.state.isOnboarded) {
        rejectRequestNotOnboarded(request, source).catch((error) =>
          logContentScriptError({
            errorMessage: error?.message ?? 'Error rejecting request when not onboarded',
            fileName: 'injected.ts',
            functionName: 'WindowEthereumRequestListener',
          }),
        )
        return
      }

      if (isProviderDirectMethod(request.method)) {
        // Provider methods are handled directly by the provider instance
        // (avoiding roundtrip to background service worker)
        providerDirectMethodHandler.handleRequest(request, source)
        return
      }

      if (isUniswapMethod(request.method)) {
        try {
          await uniswapMethodHandler.handleRequest(request, source)
        } catch (e) {
          if (e instanceof ZodError) {
            postParsingError({ source, requestId: request.requestId, method: request.method })
          }
          const errorMessage = e instanceof Error ? e.message : 'Unknown error'
          await logContentScriptError({
            errorMessage,
            fileName: 'injected.ts',
            functionName: 'WindowEthereumRequestListener',
          })
        }
        return
      }

      if (isExtensionEthMethod(request.method)) {
        try {
          await extensionEthMethodHandler.handleRequest(request, source)
        } catch (e) {
          if (e instanceof ZodError) {
            postParsingError({ source, requestId: request.requestId, method: request.method })
          }
          const errorMessage = e instanceof Error ? e.message : 'Unknown error'
          await logContentScriptError({
            errorMessage,
            fileName: 'injected.ts',
            functionName: 'WindowEthereumRequestListener',
          })
        }
        return
      }

      if (isDeprecatedMethod(request.method)) {
        postDeprecatedMethodError({ source, requestId: request.requestId, method: request.method })
        await passAnalytics(ExtensionEventName.DeprecatedMethodRequest, {
          method: request.method,
          dappUrl,
        })
        return
      }

      if (isUnsupportedMethod(request.method)) {
        postUnknownMethodError({ source, requestId: request.requestId, method: request.method })
        await passAnalytics(ExtensionEventName.UnsupportedMethodRequest, {
          method: request.method,
          dappUrl,
        })
        return
      }

      // Handle any methods we don't know how to handle and are not in the metamask API
      await passAnalytics(ExtensionEventName.UnrecognizedMethodRequest, {
        method: request.method,
        dappUrl,
      })
      postUnknownMethodError({ source, requestId: request.requestId, method: request.method })
    },
  })

  externalDappMessageChannel.addMessageListener(ExtensionToDappRequestType.SwitchChain, (message) => {
    setChainIdAndMaybeEmit(message.chainId)
    setProvider(new JsonRpcProvider(message.providerUrl, parseInt(message.chainId)))
  })

  externalDappMessageChannel.addMessageListener(ExtensionToDappRequestType.UpdateConnections, (message) => {
    setConnectedAddressesAndMaybeEmit(message.addresses)
  })

  async function init(): Promise<void> {
    try {
      await Promise.all([backgroundStore.init(), dappStore.init()])

      const chainId = getChainId()
      const provider = getProvider()

      if (chainId && !provider) {
        const chainIdNum = parseInt(chainId, 16)
        const defaultProvider = walletContextValue.providers.getProvider(chainIdNum)
        setProvider(defaultProvider)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await logContentScriptError({
        errorMessage,
        fileName: 'injected.ts',
        functionName: 'init',
      })
    }
  }

  /** Helper function to reject all requests from dapps when the extension is not onboarded. */
  async function rejectRequestNotOnboarded(
    request: WindowEthereumRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    if (request.method === EthMethod.EthRequestAccounts || request.method === EthMethod.WalletRequestPermissions) {
      await contentScriptUtilityMessageChannel.sendMessage({
        type: ContentScriptUtilityMessageType.FocusOnboardingTab,
      })
    }

    source?.postMessage({
      requestId: request.requestId,
      error: serializeError(providerErrors.userRejectedRequest()),
    })
  }

  init().catch(() => {})

  // These go to Amplitude instead of Datadog since they are informational
  async function passAnalytics(message: string, tags: Record<string, string>): Promise<void> {
    const logMessage: AnalyticsLog = {
      type: ContentScriptUtilityMessageType.AnalyticsLog,
      message,
      tags,
    }
    await contentScriptUtilityMessageChannel.sendMessage(logMessage)
  }

  addWindowMessageListener<WindowEthereumConfigRequest>({
    validator: isValidWindowEthereumConfigRequest,
    handler: async () => {
      const isDefaultProvider = await getIsDefaultProviderFromStorage()
      window.postMessage({ type: ETH_PROVIDER_CONFIG.RESPONSE, config: { isDefaultProvider } })
    },
    options: { removeAfterHandled: true },
  })

  // check for arc stylesheet properties on load
  // notify background script if arc browser detected so we can disable the extension
  window.addEventListener('load', () => {
    // if styles aren't available at all, then we cannot check for the arc styles
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const isStylesAvailable = document.documentElement && !!getComputedStyle(document.documentElement).length
    if (!isStylesAvailable) {
      return
    }

    setTimeout(async () => {
      await contentScriptUtilityMessageChannel.sendMessage({
        type: ContentScriptUtilityMessageType.ArcBrowserCheck,
        isArcBrowser: isArcBrowser(),
      })
    }, ARC_STYLE_INJECTION_DELAY)
  })
}

// eslint-disable-next-line import/no-unused-modules
export default defineContentScript({
  matches:
    __DEV__ || process.env.BUILD_ENV === 'dev'
      ? ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*']
      : ['https://*/*'],
  runAt: 'document_start',
  main() {
    makeInjected()
  },
})
