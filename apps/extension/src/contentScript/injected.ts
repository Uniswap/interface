import { JsonRpcProvider } from '@ethersproject/providers'
import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { dappStore } from 'src/app/features/dapp/store'
import { getOrderedConnectedAddresses } from 'src/app/features/dapp/utils'
import { backgroundStore } from 'src/background/backgroundStore'
import {
  contentScriptUtilityMessageChannel,
  externalDappMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import { addWindowMessageListener } from 'src/background/messagePassing/messageUtils'
import {
  AnalyticsLog,
  ContentScriptUtilityMessageType,
  ErrorLog,
  ExtensionToDappRequestType,
} from 'src/background/messagePassing/types/requests'
import { ExtensionEthMethodHandler } from 'src/contentScript/methodHandlers/ExtensionEthMethodHandler'
import { ProviderDirectMethodHandler } from 'src/contentScript/methodHandlers/ProviderDirectMethodHandler'
import { UniswapMethodHandler } from 'src/contentScript/methodHandlers/UniswapMethodHandler'
import { emitAccountsChanged, emitChainChanged } from 'src/contentScript/methodHandlers/emitUtils'
import { ExtensionEthMethods } from 'src/contentScript/methodHandlers/requestMethods'
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
  WindowEthereumConfigRequest,
  WindowEthereumRequest,
  isValidWindowEthereumConfigRequest,
  isValidWindowEthereumRequest,
} from 'src/contentScript/types'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { logger } from 'utilities/src/logger/logger'
import { arraysAreEqual } from 'utilities/src/primitives/array'
import { walletContextValue } from 'wallet/src/features/wallet/context'

import { getIsDefaultProviderFromStorage } from 'src/app/utils/provider'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { ZodError } from 'zod'

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
  const normalizedNewAddresses: Address[] = newConnectedAddresses
    .map((address) => getValidAddress(address))
    .filter((normalizedAddress): normalizedAddress is Address => normalizedAddress !== null)

  if (!connectedAddresses || !arraysAreEqual(connectedAddresses, normalizedNewAddresses)) {
    emitAccountsChanged(normalizedNewAddresses)
  }
  connectedAddresses = normalizedNewAddresses
}

const extensionEthMethodHandler = new ExtensionEthMethodHandler(
  getChainId,
  getProvider,
  getConnectedAddresses,
  setChainIdAndMaybeEmit,
  setProvider,
  setConnectedAddressesAndMaybeEmit,
)
const providerDirectMethodHandler = new ProviderDirectMethodHandler(
  getChainId,
  getProvider,
  getConnectedAddresses,
  setChainIdAndMaybeEmit,
  setProvider,
  setConnectedAddressesAndMaybeEmit,
)

const uniswapMethodHandler = new UniswapMethodHandler(
  getChainId,
  getProvider,
  getConnectedAddresses,
  setChainIdAndMaybeEmit,
  setProvider,
  setConnectedAddressesAndMaybeEmit,
)

addWindowMessageListener<WindowEthereumRequest>(isValidWindowEthereumRequest, async (request, source) => {
  logger.debug('injected.ts', 'Request received for method', JSON.stringify(request), _provider)

  if (!backgroundStore.state.isOnboarded) {
    rejectRequestNotOnboarded(request, source).catch((error) =>
      logError(
        error?.message ?? 'Error rejecting request when not onboarded',
        'injected.ts',
        'WindowEthereumRequestListener',
      ),
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
        postParsingError(source, request.requestId, request.method)
      }
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      await logError(errorMessage, 'injected.ts', 'WindowEthereumRequest')
    }
    return
  }

  if (isExtensionEthMethod(request.method)) {
    try {
      await extensionEthMethodHandler.handleRequest(request, source)
    } catch (e) {
      if (e instanceof ZodError) {
        postParsingError(source, request.requestId, request.method)
      }
      const errorMessage = e instanceof Error ? e.message : 'Unknown error'
      await logError(errorMessage, 'injected.ts', 'WindowEthereumRequest')
    }
    return
  }

  if (isDeprecatedMethod(request.method)) {
    postDeprecatedMethodError(source, request.requestId, request.method)
    await passAnalytics(ExtensionEventName.DeprecatedMethodRequest, {
      method: request.method,
      dappUrl,
    })
    return
  }

  if (isUnsupportedMethod(request.method)) {
    postUnknownMethodError(source, request.requestId, request.method)
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
  postUnknownMethodError(source, request.requestId, request.method)
})

externalDappMessageChannel.addMessageListener(ExtensionToDappRequestType.SwitchChain, (message) => {
  setChainIdAndMaybeEmit(message.chainId)
  setProvider(new JsonRpcProvider(message.providerUrl))
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
    await logError(errorMessage, 'injected.ts', 'init')
  }
}

/** Helper function to reject all requests from dapps when the extension is not onboarded. */
async function rejectRequestNotOnboarded(
  request: WindowEthereumRequest,
  source: MessageEventSource | null,
): Promise<void> {
  if (
    request.method === ExtensionEthMethods.eth_requestAccounts ||
    request.method === ExtensionEthMethods.wallet_requestPermissions
  ) {
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

async function logError(
  errorMessage: string,
  fileName: string,
  functionName: string,
  tags?: Record<string, string>,
): Promise<void> {
  const message: ErrorLog = {
    type: ContentScriptUtilityMessageType.ErrorLog,
    message: errorMessage,
    fileName,
    functionName,
    tags,
  }
  await contentScriptUtilityMessageChannel.sendMessage(message)
}

// These go to Amplitude instead of Datadog since they are informational
async function passAnalytics(message: string, tags: Record<string, string>): Promise<void> {
  const logMessage: AnalyticsLog = {
    type: ContentScriptUtilityMessageType.AnalyticsLog,
    message,
    tags,
  }
  await contentScriptUtilityMessageChannel.sendMessage(logMessage)
}

addWindowMessageListener<WindowEthereumConfigRequest>(
  isValidWindowEthereumConfigRequest,
  async () => {
    const isDefaultProvider = await getIsDefaultProviderFromStorage()
    window.postMessage({ type: ETH_PROVIDER_CONFIG.RESPONSE, config: { isDefaultProvider } })
  },
  undefined,
  { removeAfterHandled: true },
)
