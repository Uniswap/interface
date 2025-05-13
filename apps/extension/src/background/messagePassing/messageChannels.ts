import {
  AccountResponse,
  AccountResponseSchema,
  ChainIdResponse,
  ChainIdResponseSchema,
  ChangeChainRequest,
  ChangeChainRequestSchema,
  ChangeChainResponse,
  ChangeChainResponseSchema,
  ErrorResponse,
  ErrorResponseSchema,
  GetAccountRequest,
  GetAccountRequestSchema,
  GetCallsStatusRequest,
  GetCallsStatusRequestSchema,
  GetCallsStatusResponse,
  GetCallsStatusResponseSchema,
  GetCapabilitiesRequest,
  GetCapabilitiesRequestSchema,
  GetCapabilitiesResponse,
  GetCapabilitiesResponseSchema,
  GetChainIdRequest,
  GetChainIdRequestSchema,
  GetPermissionsRequest,
  GetPermissionsRequestSchema,
  GetPermissionsResponse,
  GetPermissionsResponseSchema,
  RequestAccountRequest,
  RequestAccountRequestSchema,
  RequestPermissionsRequest,
  RequestPermissionsRequestSchema,
  RequestPermissionsResponse,
  RequestPermissionsResponseSchema,
  RevokePermissionsRequest,
  RevokePermissionsRequestSchema,
  RevokePermissionsResponse,
  RevokePermissionsResponseSchema,
  SendCallsRequest,
  SendCallsRequestSchema,
  SendCallsResponse,
  SendCallsResponseSchema,
  SendTransactionRequest,
  SendTransactionRequestSchema,
  SendTransactionResponse,
  SendTransactionResponseSchema,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignMessageResponse,
  SignMessageResponseSchema,
  SignTransactionRequest,
  SignTransactionRequestSchema,
  SignTransactionResponse,
  SignTransactionResponseSchema,
  SignTypedDataRequest,
  SignTypedDataRequestSchema,
  SignTypedDataResponse,
  SignTypedDataResponseSchema,
  UniswapOpenSidebarRequest,
  UniswapOpenSidebarRequestSchema,
  UniswapOpenSidebarResponse,
  UniswapOpenSidebarResponseSchema,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { TypedPortMessageChannel, TypedRuntimeMessageChannel } from 'src/background/messagePassing/platform'
import {
  HighlightOnboardingTabMessage,
  HighlightOnboardingTabMessageSchema,
  OnboardingMessageType,
  SidebarOpenedMessage,
  SidebarOpenedMessageSchema,
} from 'src/background/messagePassing/types/ExtensionMessages'
import {
  AnalyticsLog,
  AnalyticsLogSchema,
  ArcBrowserCheckMessage,
  ArcBrowserCheckMessageSchema,
  BackgroundToSidePanelRequestType,
  ContentScriptUtilityMessageType,
  DappRequestMessage,
  DappRequestMessageSchema,
  ErrorLog,
  ErrorLogSchema,
  ExtensionChainChange,
  ExtensionChainChangeSchema,
  ExtensionToDappRequestType,
  FocusOnboardingMessage,
  FocusOnboardingMessageSchema,
  RefreshUnitagsRequest,
  RefreshUnitagsRequestSchema,
  TabActivatedRequest,
  TabActivatedRequestSchema,
  UpdateConnectionRequest,
  UpdateConnectionRequestSchema,
} from 'src/background/messagePassing/types/requests'
import { MessageParsers } from 'uniswap/src/extension/messagePassing/platform'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'

enum MessageChannelName {
  DappContentScript = 'DappContentScript',
  DappBackground = 'DappBackground',
  DappResponse = 'DappResponse',
  Onboarding = 'Onboarding',
  ExternalDapp = 'ExternalDapp',
  ContentScriptUtility = 'ContentScriptUtility',
}

type OnboardingMessageSchemas = {
  [OnboardingMessageType.HighlightOnboardingTab]: HighlightOnboardingTabMessage
  [OnboardingMessageType.SidebarOpened]: SidebarOpenedMessage
}
const onboardingMessageParsers: MessageParsers<OnboardingMessageType, OnboardingMessageSchemas> = {
  [OnboardingMessageType.HighlightOnboardingTab]: (message): HighlightOnboardingTabMessage =>
    HighlightOnboardingTabMessageSchema.parse(message),
  [OnboardingMessageType.SidebarOpened]: (message): SidebarOpenedMessage => SidebarOpenedMessageSchema.parse(message),
}

function createOnboardingMessageChannel(): TypedRuntimeMessageChannel<OnboardingMessageType, OnboardingMessageSchemas> {
  return new TypedRuntimeMessageChannel<OnboardingMessageType, OnboardingMessageSchemas>({
    channelName: MessageChannelName.Onboarding,
    messageParsers: onboardingMessageParsers,
  })
}

type BackgroundToSidePanelMessageSchemas = {
  [BackgroundToSidePanelRequestType.DappRequestReceived]: DappRequestMessage
  [BackgroundToSidePanelRequestType.TabActivated]: TabActivatedRequest
  [BackgroundToSidePanelRequestType.RefreshUnitags]: RefreshUnitagsRequest
}
const backgroundToSidePanelMessageParsers: MessageParsers<
  BackgroundToSidePanelRequestType,
  BackgroundToSidePanelMessageSchemas
> = {
  [BackgroundToSidePanelRequestType.DappRequestReceived]: (message): DappRequestMessage =>
    DappRequestMessageSchema.parse(message),
  [BackgroundToSidePanelRequestType.TabActivated]: (message): TabActivatedRequest =>
    TabActivatedRequestSchema.parse(message),
  [BackgroundToSidePanelRequestType.RefreshUnitags]: (message): RefreshUnitagsRequest =>
    RefreshUnitagsRequestSchema.parse(message),
}

function createBackgroundToSidePanelMessageChannel(): TypedRuntimeMessageChannel<
  BackgroundToSidePanelRequestType,
  BackgroundToSidePanelMessageSchemas
> {
  return new TypedRuntimeMessageChannel<BackgroundToSidePanelRequestType, BackgroundToSidePanelMessageSchemas>({
    channelName: MessageChannelName.DappBackground,
    messageParsers: backgroundToSidePanelMessageParsers,
    canReceiveFromWebPage: true,
  })
}

export function createBackgroundToSidePanelMessagePort(
  port: chrome.runtime.Port,
): TypedPortMessageChannel<BackgroundToSidePanelRequestType, BackgroundToSidePanelMessageSchemas> {
  return new TypedPortMessageChannel<BackgroundToSidePanelRequestType, BackgroundToSidePanelMessageSchemas>({
    channelName: MessageChannelName.DappBackground,
    messageParsers: backgroundToSidePanelMessageParsers,
    port,
  })
}

type ContentScriptToBackgroundMessageSchemas = {
  [DappRequestType.ChangeChain]: ChangeChainRequest
  [DappRequestType.GetAccount]: GetAccountRequest
  [DappRequestType.GetChainId]: GetChainIdRequest
  [DappRequestType.GetPermissions]: GetPermissionsRequest
  [DappRequestType.RequestAccount]: RequestAccountRequest
  [DappRequestType.RequestPermissions]: RequestPermissionsRequest
  [DappRequestType.RevokePermissions]: RevokePermissionsRequest
  [DappRequestType.SendTransaction]: SendTransactionRequest
  [DappRequestType.SignMessage]: SignMessageRequest
  [DappRequestType.SignTransaction]: SignTransactionRequest
  [DappRequestType.SignTypedData]: SignTypedDataRequest
  [DappRequestType.UniswapOpenSidebar]: UniswapOpenSidebarRequest
  [DappRequestType.SendCalls]: SendCallsRequest
  [DappRequestType.GetCallsStatus]: GetCallsStatusRequest
  [DappRequestType.GetCapabilities]: GetCapabilitiesRequest
}
const contentScriptToBackgroundMessageParsers: MessageParsers<
  DappRequestType,
  ContentScriptToBackgroundMessageSchemas
> = {
  [DappRequestType.ChangeChain]: (message): ChangeChainRequest => ChangeChainRequestSchema.parse(message),
  [DappRequestType.GetAccount]: (message): GetAccountRequest => GetAccountRequestSchema.parse(message),
  [DappRequestType.GetChainId]: (message): GetChainIdRequest => GetChainIdRequestSchema.parse(message),
  [DappRequestType.GetPermissions]: (message): GetPermissionsRequest => GetPermissionsRequestSchema.parse(message),
  [DappRequestType.RequestAccount]: (message): RequestAccountRequest => RequestAccountRequestSchema.parse(message),
  [DappRequestType.RequestPermissions]: (message): RequestPermissionsRequest =>
    RequestPermissionsRequestSchema.parse(message),
  [DappRequestType.RevokePermissions]: (message): RevokePermissionsRequest =>
    RevokePermissionsRequestSchema.parse(message),
  [DappRequestType.SendTransaction]: (message): SendTransactionRequest => SendTransactionRequestSchema.parse(message),
  [DappRequestType.SignMessage]: (message): SignMessageRequest => SignMessageRequestSchema.parse(message),
  [DappRequestType.SignTransaction]: (message): SignTransactionRequest => SignTransactionRequestSchema.parse(message),
  [DappRequestType.SignTypedData]: (message): SignTypedDataRequest => SignTypedDataRequestSchema.parse(message),
  [DappRequestType.UniswapOpenSidebar]: (message): UniswapOpenSidebarRequest =>
    UniswapOpenSidebarRequestSchema.parse(message),
  [DappRequestType.SendCalls]: (message): SendCallsRequest => SendCallsRequestSchema.parse(message),
  [DappRequestType.GetCallsStatus]: (message): GetCallsStatusRequest => GetCallsStatusRequestSchema.parse(message),
  [DappRequestType.GetCapabilities]: (message): GetCapabilitiesRequest => GetCapabilitiesRequestSchema.parse(message),
}

function createContentScriptToBackgroundMessageChannel(): TypedRuntimeMessageChannel<
  DappRequestType,
  ContentScriptToBackgroundMessageSchemas
> {
  return new TypedRuntimeMessageChannel<DappRequestType, ContentScriptToBackgroundMessageSchemas>({
    channelName: MessageChannelName.DappContentScript,
    messageParsers: contentScriptToBackgroundMessageParsers,
    canReceiveFromWebPage: true,
  })
}

type DappResponseMessageSchemas = {
  [DappResponseType.AccountResponse]: AccountResponse
  [DappResponseType.ChainChangeResponse]: ChangeChainResponse
  [DappResponseType.ChainIdResponse]: ChainIdResponse
  [DappResponseType.ErrorResponse]: ErrorResponse
  [DappResponseType.GetPermissionsResponse]: GetPermissionsResponse
  [DappResponseType.RequestPermissionsResponse]: RequestPermissionsResponse
  [DappResponseType.RevokePermissionsResponse]: RevokePermissionsResponse
  [DappResponseType.SendTransactionResponse]: SendTransactionResponse
  [DappResponseType.SignMessageResponse]: SignMessageResponse
  [DappResponseType.SignTransactionResponse]: SignTransactionResponse
  [DappResponseType.SignTypedDataResponse]: SignTypedDataResponse
  [DappResponseType.UniswapOpenSidebarResponse]: UniswapOpenSidebarResponse
  [DappResponseType.SendCallsResponse]: SendCallsResponse
  [DappResponseType.GetCallsStatusResponse]: GetCallsStatusResponse
  [DappResponseType.GetCapabilitiesResponse]: GetCapabilitiesResponse
}
const dappResponseMessageParsers: MessageParsers<DappResponseType, DappResponseMessageSchemas> = {
  [DappResponseType.AccountResponse]: (message): AccountResponse => AccountResponseSchema.parse(message),
  [DappResponseType.ChainChangeResponse]: (message): ChangeChainResponse => ChangeChainResponseSchema.parse(message),
  [DappResponseType.ChainIdResponse]: (message): ChainIdResponse => ChainIdResponseSchema.parse(message),
  [DappResponseType.ErrorResponse]: (message): ErrorResponse => ErrorResponseSchema.parse(message),
  [DappResponseType.GetPermissionsResponse]: (message): GetPermissionsResponse =>
    GetPermissionsResponseSchema.parse(message),
  [DappResponseType.RequestPermissionsResponse]: (message): RequestPermissionsResponse =>
    RequestPermissionsResponseSchema.parse(message),
  [DappResponseType.RevokePermissionsResponse]: (message): RevokePermissionsResponse =>
    RevokePermissionsResponseSchema.parse(message),
  [DappResponseType.SendTransactionResponse]: (message): SendTransactionResponse =>
    SendTransactionResponseSchema.parse(message),
  [DappResponseType.SignMessageResponse]: (message): SignMessageResponse => SignMessageResponseSchema.parse(message),
  [DappResponseType.SignTransactionResponse]: (message): SignTransactionResponse =>
    SignTransactionResponseSchema.parse(message),
  [DappResponseType.SignTypedDataResponse]: (message): SignTypedDataResponse =>
    SignTypedDataResponseSchema.parse(message),
  [DappResponseType.UniswapOpenSidebarResponse]: (message): UniswapOpenSidebarResponse =>
    UniswapOpenSidebarResponseSchema.parse(message),
  [DappResponseType.SendCallsResponse]: (message): SendCallsResponse => SendCallsResponseSchema.parse(message),
  [DappResponseType.GetCallsStatusResponse]: (message): GetCallsStatusResponse =>
    GetCallsStatusResponseSchema.parse(message),
  [DappResponseType.GetCapabilitiesResponse]: (message): GetCapabilitiesResponse =>
    GetCapabilitiesResponseSchema.parse(message),
}

function createDappResponseMessageChannel(): TypedRuntimeMessageChannel<DappResponseType, DappResponseMessageSchemas> {
  return new TypedRuntimeMessageChannel<DappResponseType, DappResponseMessageSchemas>({
    channelName: MessageChannelName.DappResponse,
    messageParsers: dappResponseMessageParsers,
  })
}

type ExternalDappMessageSchemas = {
  [ExtensionToDappRequestType.SwitchChain]: ExtensionChainChange
  [ExtensionToDappRequestType.UpdateConnections]: UpdateConnectionRequest
}
const externalDappMessageParsers: MessageParsers<ExtensionToDappRequestType, ExternalDappMessageSchemas> = {
  [ExtensionToDappRequestType.SwitchChain]: (message): ExtensionChainChange =>
    ExtensionChainChangeSchema.parse(message),
  [ExtensionToDappRequestType.UpdateConnections]: (message): UpdateConnectionRequest =>
    UpdateConnectionRequestSchema.parse(message),
}

function createExternalDappMessageChannel(): TypedRuntimeMessageChannel<
  ExtensionToDappRequestType,
  ExternalDappMessageSchemas
> {
  return new TypedRuntimeMessageChannel<ExtensionToDappRequestType, ExternalDappMessageSchemas>({
    channelName: MessageChannelName.ExternalDapp,
    messageParsers: externalDappMessageParsers,
  })
}

type ContentScriptUtilityMessageSchemas = {
  [ContentScriptUtilityMessageType.ArcBrowserCheck]: ArcBrowserCheckMessage
  [ContentScriptUtilityMessageType.FocusOnboardingTab]: FocusOnboardingMessage
  [ContentScriptUtilityMessageType.ErrorLog]: ErrorLog
  [ContentScriptUtilityMessageType.AnalyticsLog]: AnalyticsLog
}
const contentScriptUtilityMessageParsers: MessageParsers<
  ContentScriptUtilityMessageType,
  ContentScriptUtilityMessageSchemas
> = {
  [ContentScriptUtilityMessageType.ArcBrowserCheck]: (message): ArcBrowserCheckMessage =>
    ArcBrowserCheckMessageSchema.parse(message),
  [ContentScriptUtilityMessageType.FocusOnboardingTab]: (message): FocusOnboardingMessage =>
    FocusOnboardingMessageSchema.parse(message),
  [ContentScriptUtilityMessageType.ErrorLog]: (message): ErrorLog => ErrorLogSchema.parse(message),
  [ContentScriptUtilityMessageType.AnalyticsLog]: (message): AnalyticsLog => AnalyticsLogSchema.parse(message),
}

function createContentScriptUtilityMessageChannel(): TypedRuntimeMessageChannel<
  ContentScriptUtilityMessageType,
  ContentScriptUtilityMessageSchemas
> {
  return new TypedRuntimeMessageChannel<ContentScriptUtilityMessageType, ContentScriptUtilityMessageSchemas>({
    channelName: MessageChannelName.ContentScriptUtility,
    messageParsers: contentScriptUtilityMessageParsers,
    canReceiveFromWebPage: true,
  })
}

export const onboardingMessageChannel = createOnboardingMessageChannel()
export const backgroundToSidePanelMessageChannel = createBackgroundToSidePanelMessageChannel()
export const contentScriptToBackgroundMessageChannel = createContentScriptToBackgroundMessageChannel()
export const dappResponseMessageChannel = createDappResponseMessageChannel()
export const externalDappMessageChannel = createExternalDappMessageChannel()
export const contentScriptUtilityMessageChannel = createContentScriptUtilityMessageChannel()

export type DappBackgroundPortChannel = ReturnType<typeof createBackgroundToSidePanelMessagePort>
