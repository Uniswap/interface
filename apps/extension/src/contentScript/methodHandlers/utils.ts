import { providerErrors, serializeError } from '@metamask/rpc-errors'
import {
  DeprecatedEthMethods,
  ProviderDirectMethods,
  UniswapMethods,
  UnsupportedEthMethods,
} from 'src/contentScript/methodHandlers/requestMethods'
import { PendingResponseInfo } from 'src/contentScript/methodHandlers/types'
import { DappResponseType, EthMethod, ExtensionEthMethod } from 'uniswap/src/features/dappRequests/types'
import { logger } from 'utilities/src/logger/logger'

export function isProviderDirectMethod(method: string): boolean {
  return Object.keys(ProviderDirectMethods).includes(method)
}

export function isUniswapMethod(method: string): boolean {
  return Object.keys(UniswapMethods).includes(method)
}

// Since ExtensionEthMethod is a TypeScript type that doesn't exist at runtime,
// we need to explicitly list its values here for string comparison
const extensionEthMethodValues: ExtensionEthMethod[] = [
  EthMethod.EthChainId,
  EthMethod.EthRequestAccounts,
  EthMethod.EthAccounts,
  EthMethod.EthSendTransaction,
  EthMethod.PersonalSign,
  EthMethod.WalletSwitchEthereumChain,
  EthMethod.WalletGetPermissions,
  EthMethod.WalletRequestPermissions,
  EthMethod.WalletRevokePermissions,
  EthMethod.WalletGetCapabilities,
  EthMethod.WalletSendCalls,
  EthMethod.WalletGetCallsStatus,
  EthMethod.SignTypedDataV4,
]

export function isExtensionEthMethod(method: string): boolean {
  return extensionEthMethodValues.some((enumValue) => enumValue === method)
}

export function isDeprecatedMethod(method: string): boolean {
  return Object.keys(DeprecatedEthMethods).includes(method)
}

export function isUnsupportedMethod(method: string): boolean {
  return Object.keys(UnsupportedEthMethods).includes(method)
}

export function postDeprecatedMethodError(source: MessageEventSource | null, requestId: string, method: string): void {
  source?.postMessage({
    requestId,
    error: serializeError(
      providerErrors.unsupportedMethod(`Uniswap Wallet does not support ${method} as it is deprecated`),
    ),
  })
}

export function postUnknownMethodError(source: MessageEventSource | null, requestId: string, method: string): void {
  source?.postMessage({
    requestId,
    error: serializeError(providerErrors.unsupportedMethod(`Uniswap Wallet does not support ${method}`)),
  })
}

export function postUnauthorizedError(source: MessageEventSource | null, requestId: string): void {
  source?.postMessage({
    requestId,
    error: serializeError(providerErrors.unauthorized()),
  })
}

export function postParsingError(source: MessageEventSource | null, requestId: string, method: string): void {
  source?.postMessage({
    requestId,
    error: serializeError(
      providerErrors.unsupportedMethod(`Uniswap Wallet could not parse the ${method} request properly`),
    ),
  })
}

export function getPendingResponseInfo(
  requestIdToSourceMap: Map<string, PendingResponseInfo>,
  requestId: string,
  type: DappResponseType,
): PendingResponseInfo | undefined {
  const pendingResponseInfo = requestIdToSourceMap.get(requestId)
  if (pendingResponseInfo) {
    requestIdToSourceMap.delete(requestId)

    if (type !== DappResponseType.ErrorResponse && type !== pendingResponseInfo.type) {
      logger.error(
        `Response type doesn't match expected type, expected: ${pendingResponseInfo.type}, actual: ${type}`,
        {
          tags: {
            file: 'injected.ts',
            function: 'validateResponse',
          },
        },
      )
    }
    return pendingResponseInfo
  }

  return undefined
}
