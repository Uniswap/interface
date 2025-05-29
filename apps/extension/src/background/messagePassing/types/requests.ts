import { DappRequestSchema } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { MessageSchema } from 'uniswap/src/extension/messagePassing/messageTypes'
import { z } from 'zod'

// ENUMS

// Requests from content scripts to the extension (non-dapp requests)
export enum ContentScriptUtilityMessageType {
  ArcBrowserCheck = 'ArcBrowserCheck',
  FocusOnboardingTab = 'FocusOnboardingTab',
  ErrorLog = 'Error',
  AnalyticsLog = 'AnalyticsLog',
}

export const ErrorLogSchema = MessageSchema.extend({
  type: z.literal(ContentScriptUtilityMessageType.ErrorLog),
  message: z.string(),
  fileName: z.string(),
  functionName: z.string(),
  tags: z.record(z.string()).optional(),
  extra: z.record(z.unknown()).optional(),
})
export type ErrorLog = z.infer<typeof ErrorLogSchema>

export const ArcBrowserCheckMessageSchema = MessageSchema.extend({
  type: z.literal(ContentScriptUtilityMessageType.ArcBrowserCheck),
  isArcBrowser: z.boolean(),
})

export type ArcBrowserCheckMessage = z.infer<typeof ArcBrowserCheckMessageSchema>

export const AnalyticsLogSchema = MessageSchema.extend({
  type: z.literal(ContentScriptUtilityMessageType.AnalyticsLog),
  message: z.string(),
  tags: z.record(z.string()),
})
export type AnalyticsLog = z.infer<typeof AnalyticsLogSchema>

export const FocusOnboardingMessageSchema = MessageSchema.extend({
  type: z.literal(ContentScriptUtilityMessageType.FocusOnboardingTab),
})
export type FocusOnboardingMessage = z.infer<typeof FocusOnboardingMessageSchema>

// Requests from background script to the extension sidebar
export enum BackgroundToSidePanelRequestType {
  TabActivated = 'TabActivated',
  DappRequestReceived = 'DappRequestReceived',
  RefreshUnitags = 'RefreshUnitags',
}

export const DappRequestMessageSchema = z.object({
  type: z.literal(BackgroundToSidePanelRequestType.DappRequestReceived),
  dappRequest: DappRequestSchema,
  senderTabInfo: z.object({
    id: z.number(),
    url: z.string(),
    favIconUrl: z.string().optional(),
  }),
  isSidebarClosed: z.optional(z.boolean()),
})
export type DappRequestMessage = z.infer<typeof DappRequestMessageSchema>

export const TabActivatedRequestSchema = MessageSchema.extend({
  type: z.literal(BackgroundToSidePanelRequestType.TabActivated),
})
export type TabActivatedRequest = z.infer<typeof TabActivatedRequestSchema>

export const RefreshUnitagsRequestSchema = MessageSchema.extend({
  type: z.literal(BackgroundToSidePanelRequestType.RefreshUnitags),
})
export type RefreshUnitagsRequest = z.infer<typeof RefreshUnitagsRequestSchema>

// Requests outgoing from the extension to the injected script
export enum ExtensionToDappRequestType {
  UpdateConnections = 'UpdateConnections',
  SwitchChain = 'SwitchChain',
}

const BaseExtensionRequestSchema = MessageSchema.extend({
  type: z.nativeEnum(ExtensionToDappRequestType),
})

export const ExtensionChainChangeSchema = BaseExtensionRequestSchema.extend({
  type: z.literal(ExtensionToDappRequestType.SwitchChain),
  chainId: z.string(),
  providerUrl: z.string(),
})
export type ExtensionChainChange = z.infer<typeof ExtensionChainChangeSchema>

export const UpdateConnectionRequestSchema = BaseExtensionRequestSchema.extend({
  type: z.literal(ExtensionToDappRequestType.UpdateConnections),
  addresses: z.array(z.string()), // TODO (Thomas): Figure out what to do for type safety here
})
export type UpdateConnectionRequest = z.infer<typeof UpdateConnectionRequestSchema>
