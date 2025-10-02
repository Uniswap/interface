/* eslint-disable max-lines */
import { JsonRpcProvider } from '@ethersproject/providers'
import { getPermissions } from 'src/app/features/dappRequests/permissions'
import { SendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import {
  contentScriptToBackgroundMessageChannel,
  dappResponseMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import getCalldataInfoFromTransaction from 'src/background/utils/getCalldataInfoFromTransaction'
import { BaseMethodHandler } from 'src/contentScript/methodHandlers/BaseMethodHandler'
import { PendingResponseInfo } from 'src/contentScript/methodHandlers/types'
import {
  getPendingResponseInfo,
  postUnauthorizedError,
  rejectSelfCallWithData,
} from 'src/contentScript/methodHandlers/utils'
import { WindowEthereumRequest } from 'src/contentScript/types'
import {
  EthAccountsRequest,
  EthAccountsRequestSchema,
  EthChainIdRequest,
  EthChainIdRequestSchema,
  EthRequestAccountsRequest,
  EthRequestAccountsRequestSchema,
  EthSendTransactionRequest,
  EthSendTransactionRequestSchema,
  EthSignTypedDataV4Request,
  EthSignTypedDataV4RequestSchema,
  PersonalSignRequest,
  PersonalSignRequestSchema,
  WalletGetCallsStatusRequest,
  WalletGetCallsStatusRequestSchema,
  WalletGetCapabilitiesRequest,
  WalletGetCapabilitiesRequestSchema,
  WalletGetPermissionsRequest,
  WalletGetPermissionsRequestSchema,
  WalletRequestPermissionsRequest,
  WalletRequestPermissionsRequestSchema,
  WalletRevokePermissionsRequest,
  WalletRevokePermissionsRequestSchema,
  WalletSendCallsRequest,
  WalletSendCallsRequestSchema,
  WalletSwitchEthereumChainRequest,
  WalletSwitchEthereumChainRequestSchema,
} from 'src/contentScript/WindowEthereumRequestTypes'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToHexadecimalString, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { DappRequestType, DappResponseType, EthMethod } from 'uniswap/src/features/dappRequests/types'
import { isSelfCallWithData } from 'uniswap/src/features/dappRequests/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { extractBaseUrl } from 'utilities/src/format/urls'

export class ExtensionEthMethodHandler extends BaseMethodHandler<WindowEthereumRequest> {
  private readonly requestIdToSourceMap: Map<string, PendingResponseInfo> = new Map()

  constructor({
    getChainId,
    getProvider,
    getConnectedAddresses,
    setChainIdAndMaybeEmit,
    setProvider,
    setConnectedAddressesAndMaybeEmit,
  }: {
    getChainId: () => string | undefined
    getProvider: () => JsonRpcProvider | undefined
    getConnectedAddresses: () => Address[] | undefined
    setChainIdAndMaybeEmit: (newChainId: string) => void
    setProvider: (newProvider: JsonRpcProvider) => void
    setConnectedAddressesAndMaybeEmit: (newConnectedAddresses: Address[]) => void
  }) {
    super(
      getChainId,
      getProvider,
      getConnectedAddresses,
      setChainIdAndMaybeEmit,
      setProvider,
      setConnectedAddressesAndMaybeEmit,
    )

    dappResponseMessageChannel.addMessageListener(DappResponseType.AccountResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.AccountResponse,
      })?.source

      this.handleDappUpdate({
        connectedAddresses: message.connectedAddresses,
        chainId: message.chainId,
        providerUrl: message.providerUrl,
      })
      source?.postMessage({
        requestId: message.requestId,
        result: message.connectedAddresses,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.ChainIdResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.ChainIdResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.chainId,
      })

      const chainId = this.getChainId()
      if (!chainId) {
        window.postMessage({
          emitKey: 'connect',
          emitValue: {
            chainId: message.chainId,
          },
        })
      }

      this.setChainIdAndMaybeEmit(message.chainId)
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.ChainChangeResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.ChainChangeResponse,
      })?.source

      this.setChainIdAndMaybeEmit(message.chainId)
      this.setProvider(new JsonRpcProvider(message.providerUrl, parseInt(message.chainId)))
      source?.postMessage({
        requestId: message.requestId,
        result: message.chainId,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SendTransactionResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.SendTransactionResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.transactionHash,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SignMessageResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.SignMessageResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.signature,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SignTransactionResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.SignTransactionResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.signedTransactionHash,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SignTypedDataResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.SignTypedDataResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.signature,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.RequestPermissionsResponse, (message) => {
      if (message.accounts) {
        const { connectedAddresses, chainId, providerUrl } = message.accounts
        this.handleDappUpdate({ connectedAddresses, chainId, providerUrl })
      }
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.RequestPermissionsResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.permissions,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.RevokePermissionsResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.RevokePermissionsResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: null,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.ErrorResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.ErrorResponse,
      })?.source

      source?.postMessage(message)
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SendCallsResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.SendCallsResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.response,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.GetCallsStatusResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.GetCallsStatusResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.response,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.GetCapabilitiesResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.GetCapabilitiesResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.response,
      })
    })
  }

  private isAuthorized(): boolean {
    const connectedAddresses = this.getConnectedAddresses()
    return !!connectedAddresses?.length
  }

  private isConnectedToDapp(): boolean {
    // Fields that should be populated for connected dapps
    return Boolean(this.getConnectedAddresses()?.length && this.getChainId() && this.getProvider())
  }

  private handleDappUpdate({
    connectedAddresses,
    chainId,
    providerUrl,
  }: {
    connectedAddresses: string[]
    chainId: string
    providerUrl: string
  }): void {
    this.setConnectedAddressesAndMaybeEmit(connectedAddresses)
    this.setChainIdAndMaybeEmit(chainId)
    this.setProvider(new JsonRpcProvider(providerUrl, parseInt(chainId)))
  }

  // eslint-disable-next-line complexity
  async handleRequest(request: WindowEthereumRequest, source: MessageEventSource | null): Promise<void> {
    switch (request.method) {
      case EthMethod.EthChainId: {
        const ethChainIdRequest = EthChainIdRequestSchema.parse(request)
        await this.handleEthChainIdRequest(ethChainIdRequest, source)
        break
      }
      case EthMethod.EthRequestAccounts: {
        const parsedRequest = EthRequestAccountsRequestSchema.parse(request)
        await this.handleEthRequestAccounts(parsedRequest, source)
        break
      }
      case EthMethod.EthAccounts: {
        const parsedRequest = EthAccountsRequestSchema.parse(request)
        await this.handleEthAccounts(parsedRequest, source)
        break
      }
      case EthMethod.EthSendTransaction: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        const parsedRequest = EthSendTransactionRequestSchema.parse(request)
        await this.handleEthSendTransaction(parsedRequest, source)
        break
      }
      case EthMethod.WalletGetCapabilities: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        const parsedRequest = WalletGetCapabilitiesRequestSchema.parse(request)
        if (!this.isValidRequestAddress(parsedRequest.address)) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        await this.handleWalletGetCapabilities(parsedRequest, source)
        break
      }
      case EthMethod.WalletSwitchEthereumChain: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        const parsedRequest = WalletSwitchEthereumChainRequestSchema.parse(request)
        await this.handleWalletSwitchEthereumChain(parsedRequest, source)
        break
      }
      case EthMethod.WalletGetPermissions: {
        const parsedRequest = WalletGetPermissionsRequestSchema.parse(request)
        await this.handleWalletGetPermissions(parsedRequest, source)
        break
      }

      case EthMethod.WalletRequestPermissions: {
        const parsedRequest = WalletRequestPermissionsRequestSchema.parse(request)
        await this.handleWalletRequestPermissions(parsedRequest, source)
        break
      }
      case EthMethod.WalletRevokePermissions: {
        const parsedRequest = WalletRevokePermissionsRequestSchema.parse(request)
        await this.handleWalletRevokePermissions(parsedRequest, source)
        break
      }
      case EthMethod.PersonalSign: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }

        const parsedRequest = PersonalSignRequestSchema.parse(request)
        if (!this.isValidRequestAddress(parsedRequest.address)) {
          postUnauthorizedError(source, request.requestId)
          return
        }

        await this.handlePersonalSign(parsedRequest, source)
        break
      }
      case EthMethod.SignTypedDataV4: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }

        const parsedRequest = EthSignTypedDataV4RequestSchema.parse(request)
        if (!this.isValidRequestAddress(parsedRequest.address)) {
          postUnauthorizedError(source, request.requestId)
          return
        }

        await this.handleEthSignTypedData(parsedRequest, source)
        break
      }
      case EthMethod.WalletSendCalls: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        const parsedRequest = WalletSendCallsRequestSchema.parse(request)
        await this.handleWalletSendCalls(parsedRequest, source)
        break
      }
      case EthMethod.WalletGetCallsStatus: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        const parsedRequest = WalletGetCallsStatusRequestSchema.parse(request)
        await this.handleWalletGetCallsStatus(parsedRequest, source)
        break
      }
    }
  }

  async handleEthChainIdRequest(request: EthChainIdRequest, source: MessageEventSource | null): Promise<void> {
    // TODO: WALL-4919: Remove hardcoded Mainnet
    // Defaults to mainnet for unconnected dapps
    const chainId = this.getChainId() ?? chainIdToHexadecimalString(UniverseChainId.Mainnet)

    source?.postMessage({
      requestId: request.requestId,
      result: chainId,
    })
    return
  }

  async handleEthRequestAccounts(request: EthRequestAccountsRequest, source: MessageEventSource | null): Promise<void> {
    const connectedAddresses = this.getConnectedAddresses()

    if (connectedAddresses?.length && this.isConnectedToDapp()) {
      source?.postMessage({
        requestId: request.requestId,
        result: connectedAddresses,
      })
      return
    }

    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.AccountResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.RequestAccount,
      requestId: request.requestId,
    })
  }

  async handleEthAccounts(request: EthAccountsRequest, source: MessageEventSource | null): Promise<void> {
    const connectedAddresses = this.getConnectedAddresses()

    if (connectedAddresses?.length && this.isConnectedToDapp()) {
      source?.postMessage({
        requestId: request.requestId,
        result: connectedAddresses,
      })
      return
    }

    postUnauthorizedError(source, request.requestId)
  }

  async handleEthSendTransaction(request: EthSendTransactionRequest, source: MessageEventSource | null): Promise<void> {
    // Reject transactions where from === to and data !== undefined (self-calls with data)
    if (
      isSelfCallWithData({
        from: request.transaction.from,
        to: request.transaction.to,
        data: request.transaction.data,
        chainId: toSupportedChainId(request.transaction.chainId) ?? undefined,
      })
    ) {
      rejectSelfCallWithData(request.requestId, source)
      return
    }

    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.SendTransactionResponse,
      source,
    })

    const sendTransactionRequest: SendTransactionRequest = {
      type: DappRequestType.SendTransaction,
      requestId: request.requestId,
      transaction: adaptTransactionForEthers(request.transaction),
    }

    // native transactions like native send will not have populated data field
    if (request.transaction.data && request.transaction.data !== '0x') {
      Object.assign(
        sendTransactionRequest,
        getCalldataInfoFromTransaction({
          data: request.transaction.data,
          to: request.transaction.to,
          chainId: request.transaction.chainId,
        }),
      )
    }

    await contentScriptToBackgroundMessageChannel.sendMessage(sendTransactionRequest)
  }

  async handlePersonalSign(request: PersonalSignRequest, source: MessageEventSource | null): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.SignMessageResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.SignMessage,
      requestId: request.requestId,
      messageHex: request.messageHex,
      address: request.address,
    })
  }

  async handleEthSignTypedData(request: EthSignTypedDataV4Request, source: MessageEventSource | null): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.SignTypedDataResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.SignTypedData,
      requestId: request.requestId,
      typedData: request.typedData,
      address: request.address,
    })
  }

  async handleWalletSwitchEthereumChain(
    request: WalletSwitchEthereumChainRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.ChainChangeResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.ChangeChain,
      requestId: request.requestId,
      chainId: request.chainId,
    })
  }

  async handleWalletGetPermissions(
    request: WalletGetPermissionsRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    const dappUrl = extractBaseUrl(window.origin)
    const connectedAddresses = this.getConnectedAddresses()

    const permissions = getPermissions(dappUrl, connectedAddresses)

    source?.postMessage({
      requestId: request.requestId,
      result: permissions,
    })
  }

  async handleWalletRequestPermissions(
    request: WalletRequestPermissionsRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.RequestPermissionsResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.RequestPermissions,
      requestId: request.requestId,
      permissions: request.permissions,
    })
  }

  async handleWalletRevokePermissions(
    request: WalletRevokePermissionsRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.RevokePermissionsResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.RevokePermissions,
      requestId: request.requestId,
      permissions: request.permissions,
    })
  }

  private isValidRequestAddress(address: string): boolean {
    return (this.getConnectedAddresses() ?? []).some((connectedAddress) =>
      areAddressesEqual({
        addressInput1: { address: connectedAddress, platform: Platform.EVM },
        addressInput2: { address, platform: Platform.EVM },
      }),
    )
  }

  /**
   * Handle wallet_getCapabilities request
   * This returns the capabilities supported by the wallet for specific chains
   */
  async handleWalletGetCapabilities(
    request: WalletGetCapabilitiesRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.GetCapabilitiesResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.GetCapabilities,
      ...request,
    })
  }

  /**
   * Handle wallet_sendCalls request
   * This method allows dapps to send a batch of calls to the wallet
   */
  async handleWalletSendCalls(request: WalletSendCallsRequest, source: MessageEventSource | null): Promise<void> {
    // Reject if any calls have from === to and data !== undefined
    const hasSelfCallWithData = request.calls.some((call) =>
      isSelfCallWithData({
        from: request.from,
        to: call.to,
        data: call.data,
        chainId: toSupportedChainId(request.chainId) ?? undefined,
      }),
    )

    if (hasSelfCallWithData) {
      rejectSelfCallWithData(request.requestId, source)
      return
    }

    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.SendCallsResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.SendCalls,
      ...request,
    })
  }

  /**
   * Handle wallet_getCallsStatus request
   * This method returns the status of a call batch that was sent via wallet_sendCalls
   */
  async handleWalletGetCallsStatus(
    request: WalletGetCallsStatusRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.GetCallsStatusResponse,
      source,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.GetCallsStatus,
      requestId: request.requestId,
      batchId: request.batchId,
    })
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Transaction object from dapp can have various shapes requiring flexible typing
function adaptTransactionForEthers(transaction: any): any {
  if (typeof transaction.chainId === 'string') {
    transaction.chainId = parseInt(transaction.chainId, 16)
  }
  return transaction
}
