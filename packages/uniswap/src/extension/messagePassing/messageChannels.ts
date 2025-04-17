import { MessageParsers } from 'uniswap/src/extension/messagePassing/platform'
import {
  ExtensionToInterfaceRequestType,
  InterfaceToExtensionRequestType,
  PasskeyCredentialError,
  PasskeyCredentialErrorSchema,
  PasskeyCredentialRetrieved,
  PasskeyCredentialRetrievedSchema,
  PasskeyRequest,
  PasskeyRequestSchema,
  PasskeySignInFlowOpened,
  PasskeySignInFlowOpenedSchema,
} from 'uniswap/src/extension/messagePassing/types/requests'

export type ExtensionToInterfaceMessageSchemas = {
  [ExtensionToInterfaceRequestType.PasskeyRequest]: PasskeyRequest
}
export const extensionToInterfaceMessageParsers: MessageParsers<
  ExtensionToInterfaceRequestType,
  ExtensionToInterfaceMessageSchemas
> = {
  [ExtensionToInterfaceRequestType.PasskeyRequest]: (message): PasskeyRequest => PasskeyRequestSchema.parse(message),
}

export type InterfaceToExtensionMessageSchemas = {
  [InterfaceToExtensionRequestType.PasskeySignInFlowOpened]: PasskeySignInFlowOpened
  [InterfaceToExtensionRequestType.PasskeyCredentialRetrieved]: PasskeyCredentialRetrieved
  [InterfaceToExtensionRequestType.PasskeyCredentialError]: PasskeyCredentialError
}
export const interfaceToExtensionMessageParsers: MessageParsers<
  InterfaceToExtensionRequestType,
  InterfaceToExtensionMessageSchemas
> = {
  [InterfaceToExtensionRequestType.PasskeySignInFlowOpened]: (message): PasskeySignInFlowOpened =>
    PasskeySignInFlowOpenedSchema.parse(message),
  [InterfaceToExtensionRequestType.PasskeyCredentialRetrieved]: (message): PasskeyCredentialRetrieved =>
    PasskeyCredentialRetrievedSchema.parse(message),
  [InterfaceToExtensionRequestType.PasskeyCredentialError]: (message): PasskeyCredentialError =>
    PasskeyCredentialErrorSchema.parse(message),
}
