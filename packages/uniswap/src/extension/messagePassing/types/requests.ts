import { MessageSchema } from 'uniswap/src/extension/messagePassing/messageTypes'
import { z } from 'zod'

// Requests from the Extension to the Interface (Web App) and vice versa
export enum ExtensionToInterfaceRequestType {
  PasskeyRequest = 'PasskeyRequest',
}

export const PasskeyRequestSchema = MessageSchema.extend({
  type: z.literal(ExtensionToInterfaceRequestType.PasskeyRequest),
  requestId: z.string(),
  challengeJson: z.string(),
})
export type PasskeyRequest = z.infer<typeof PasskeyRequestSchema>

// Requests from the Interface (Web App) to the Extension
export enum InterfaceToExtensionRequestType {
  PasskeySignInFlowOpened = 'PasskeySignInFlowOpened',
  PasskeyCredentialRetrieved = 'PasskeyCredentialRetrieved',
  PasskeyCredentialError = 'PasskeyCredentialError',
}
export const PasskeySignInFlowOpenedSchema = MessageSchema.extend({
  type: z.literal(InterfaceToExtensionRequestType.PasskeySignInFlowOpened),
  requestId: z.string(),
})
export type PasskeySignInFlowOpened = z.infer<typeof PasskeySignInFlowOpenedSchema>

export const PasskeyCredentialRetrievedSchema = MessageSchema.extend({
  type: z.literal(InterfaceToExtensionRequestType.PasskeyCredentialRetrieved),
  requestId: z.string(),
  credential: z.string(),
})
export type PasskeyCredentialRetrieved = z.infer<typeof PasskeyCredentialRetrievedSchema>

export const PasskeyCredentialErrorSchema = MessageSchema.extend({
  type: z.literal(InterfaceToExtensionRequestType.PasskeyCredentialError),
  requestId: z.string(),
  error: z.string(),
})
export type PasskeyCredentialError = z.infer<typeof PasskeyCredentialErrorSchema>
