import { MessageParsers } from 'uniswap/src/extension/messagePassing/platform'
import {
  ExtensionToInterfaceRequestType,
  InterfaceToExtensionRequestType,
  PasskeyRequest,
  PasskeyRequestSchema,
  PasskeySignInFlowOpened,
  PasskeySignInFlowOpenedSchema,
  RecoveryExportError,
  RecoveryExportErrorSchema,
  RecoveryExportResult,
  RecoveryExportResultSchema,
  RecoveryFlowOpened,
  RecoveryFlowOpenedSchema,
  RecoveryHpkeKey,
  RecoveryHpkeKeySchema,
} from 'uniswap/src/extension/messagePassing/types/requests'

export type ExtensionToInterfaceMessageSchemas = {
  [ExtensionToInterfaceRequestType.PasskeyRequest]: PasskeyRequest
  [ExtensionToInterfaceRequestType.RecoveryHpkeKey]: RecoveryHpkeKey
}
export const extensionToInterfaceMessageParsers: MessageParsers<
  ExtensionToInterfaceRequestType,
  ExtensionToInterfaceMessageSchemas
> = {
  [ExtensionToInterfaceRequestType.PasskeyRequest]: (message): PasskeyRequest => PasskeyRequestSchema.parse(message),
  [ExtensionToInterfaceRequestType.RecoveryHpkeKey]: (message): RecoveryHpkeKey => RecoveryHpkeKeySchema.parse(message),
}

export type InterfaceToExtensionMessageSchemas = {
  [InterfaceToExtensionRequestType.PasskeySignInFlowOpened]: PasskeySignInFlowOpened
  [InterfaceToExtensionRequestType.RecoveryFlowOpened]: RecoveryFlowOpened
  [InterfaceToExtensionRequestType.RecoveryExportResult]: RecoveryExportResult
  [InterfaceToExtensionRequestType.RecoveryExportError]: RecoveryExportError
}
export const interfaceToExtensionMessageParsers: MessageParsers<
  InterfaceToExtensionRequestType,
  InterfaceToExtensionMessageSchemas
> = {
  [InterfaceToExtensionRequestType.PasskeySignInFlowOpened]: (message): PasskeySignInFlowOpened =>
    PasskeySignInFlowOpenedSchema.parse(message),
  [InterfaceToExtensionRequestType.RecoveryFlowOpened]: (message): RecoveryFlowOpened =>
    RecoveryFlowOpenedSchema.parse(message),
  [InterfaceToExtensionRequestType.RecoveryExportResult]: (message): RecoveryExportResult =>
    RecoveryExportResultSchema.parse(message),
  [InterfaceToExtensionRequestType.RecoveryExportError]: (message): RecoveryExportError =>
    RecoveryExportErrorSchema.parse(message),
}
