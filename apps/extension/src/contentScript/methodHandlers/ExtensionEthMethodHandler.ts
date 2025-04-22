/* eslint-disable max-lines */
import { JsonRpcProvider } from '@ethersproject/providers'
import { getPermissions } from 'src/app/features/dappRequests/permissions'
import {
  DappRequestType,
  DappResponseType,
  SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import {
  contentScriptToBackgroundMessageChannel,
  dappResponseMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import getCalldataInfoFromTransaction from 'src/background/utils/getCalldataInfoFromTransaction'
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
  WalletGetCapabilitiesRequest,
  WalletGetCapabilitiesRequestSchema,
  WalletGetCapabilitiesResponse,
  WalletGetPermissionsRequest,
  WalletGetPermissionsRequestSchema,
  WalletRequestPermissionsRequest,
  WalletRequestPermissionsRequestSchema,
  WalletRevokePermissionsRequest,
  WalletRevokePermissionsRequestSchema,
  WalletSwitchEthereumChainRequest,
  WalletSwitchEthereumChainRequestSchema,
} from 'src/contentScript/WindowEthereumRequestTypes'
import { BaseMethodHandler } from 'src/contentScript/methodHandlers/BaseMethodHandler'
import { ExtensionEthMethods } from 'src/contentScript/methodHandlers/requestMethods'
import { PendingResponseInfo } from 'src/contentScript/methodHandlers/types'
import { getPendingResponseInfo, postUnauthorizedError } from 'src/contentScript/methodHandlers/utils'
import { WindowEthereumRequest } from 'src/contentScript/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { extractBaseUrl } from 'utilities/src/format/urls'

export class ExtensionEthMethodHandler extends BaseMethodHandler<WindowEthereumRequest> {
  private readonly requestIdToSourceMap: Map<string, PendingResponseInfo> = new Map()

  constructor(
    getChainId: () => string | undefined,
    getProvider: () => JsonRpcProvider | undefined,
    getConnectedAddresses: () => Address[] | undefined,
    setChainIdAndMaybeEmit: (newChainId: string) => void,
    setProvider: (newProvider: JsonRpcProvider) => void,
    setConnectedAddressesAndMaybeEmit: (newConnectedAddresses: Address[]) => void,
  ) {
    super(
      getChainId,
      getProvider,
      getConnectedAddresses,
      setChainIdAndMaybeEmit,
      setProvider,
      setConnectedAddressesAndMaybeEmit,
    )

    dappResponseMessageChannel.addMessageListener(DappResponseType.AccountResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.AccountResponse,
      )?.source

      this.handleDappUpdate(message.connectedAddresses, message.chainId, message.providerUrl)
      source?.postMessage({
        requestId: message.requestId,
        result: message.connectedAddresses,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.ChainIdResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.ChainIdResponse,
      )?.source

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
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.ChainChangeResponse,
      )?.source

      this.setChainIdAndMaybeEmit(message.chainId)
      this.setProvider(new JsonRpcProvider(message.providerUrl))
      source?.postMessage({
        requestId: message.requestId,
        result: message.chainId,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SendTransactionResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.SendTransactionResponse,
      )?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.transactionResponse.hash,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SignMessageResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.SignMessageResponse,
      )?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.signature,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SignTransactionResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.SignTransactionResponse,
      )?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.signedTransactionHash,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.SignTypedDataResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.SignTypedDataResponse,
      )?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.signature,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.RequestPermissionsResponse, (message) => {
      if (message.accounts) {
        const { connectedAddresses, chainId, providerUrl } = message.accounts
        this.handleDappUpdate(connectedAddresses, chainId, providerUrl)
      }
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.RequestPermissionsResponse,
      )?.source

      source?.postMessage({
        requestId: message.requestId,
        result: message.permissions,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.RevokePermissionsResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.RevokePermissionsResponse,
      )?.source

      source?.postMessage({
        requestId: message.requestId,
        result: null,
      })
    })

    dappResponseMessageChannel.addMessageListener(DappResponseType.ErrorResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.ErrorResponse,
      )?.source

      source?.postMessage(message)
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

  private handleDappUpdate(connectedAddresses: string[], chainId: string, providerUrl: string): void {
    this.setConnectedAddressesAndMaybeEmit(connectedAddresses)
    this.setChainIdAndMaybeEmit(chainId)
    this.setProvider(new JsonRpcProvider(providerUrl))
  }

  async handleRequest(request: WindowEthereumRequest, source: MessageEventSource | null): Promise<void> {
    switch (request.method) {
      case ExtensionEthMethods.eth_chainId: {
        const ethChainIdRequest = EthChainIdRequestSchema.parse(request)
        await this.handleEthChainIdRequest(ethChainIdRequest, source)
        break
      }
      case ExtensionEthMethods.eth_requestAccounts: {
        const parsedRequest = EthRequestAccountsRequestSchema.parse(request)
        await this.handleEthRequestAccounts(parsedRequest, source)
        break
      }
      case ExtensionEthMethods.eth_accounts: {
        const parsedRequest = EthAccountsRequestSchema.parse(request)
        await this.handleEthAccounts(parsedRequest, source)
        break
      }
      case ExtensionEthMethods.eth_sendTransaction: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        const parsedRequest = EthSendTransactionRequestSchema.parse(request)
        await this.handleEthSendTransaction(parsedRequest, source)
        break
      }
      case ExtensionEthMethods.wallet_getCapabilities: {
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
      case ExtensionEthMethods.wallet_switchEthereumChain: {
        if (!this.isAuthorized()) {
          postUnauthorizedError(source, request.requestId)
          return
        }
        const parsedRequest = WalletSwitchEthereumChainRequestSchema.parse(request)
        await this.handleWalletSwitchEthereumChain(parsedRequest, source)
        break
      }
      case ExtensionEthMethods.wallet_getPermissions: {
        const parsedRequest = WalletGetPermissionsRequestSchema.parse(request)
        await this.handleWalletGetPermissions(parsedRequest, source)
        break
      }

      case ExtensionEthMethods.wallet_requestPermissions: {
        const parsedRequest = WalletRequestPermissionsRequestSchema.parse(request)
        await this.handleWalletRequestPermissions(parsedRequest, source)
        break
      }
      case ExtensionEthMethods.wallet_revokePermissions: {
        const parsedRequest = WalletRevokePermissionsRequestSchema.parse(request)
        await this.handleWalletRevokePermissions(parsedRequest, source)
        break
      }
      case ExtensionEthMethods.personal_sign: {
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
      case ExtensionEthMethods.eth_signTypedData_v4: {
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
        getCalldataInfoFromTransaction(request.transaction.data, request.transaction.to, request.transaction.chainId),
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
    return (this.getConnectedAddresses() ?? []).some((connectedAddress) => areAddressesEqual(connectedAddress, address))
  }

  /**
   * Handle wallet_getCapabilities request
   * This returns the capabilities supported by the wallet for specific chains
   */
  async handleWalletGetCapabilities(
    request: WalletGetCapabilitiesRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    const capabilities: WalletGetCapabilitiesResponse = {} // For now, returning an empty object
    source?.postMessage({
      requestId: request.requestId,
      result: capabilities,
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptTransactionForEthers(transaction: any): any {
  if (typeof transaction.chainId === 'string') {
    transaction.chainId = parseInt(transaction.chainId, 16)
  }
  return transaction
}
