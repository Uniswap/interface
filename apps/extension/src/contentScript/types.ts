import { z } from 'zod'

export enum ETH_PROVIDER_CONFIG {
  REQUEST = 'ETHEREUM_PROVIDER_SCHEMA_REQUEST',
  RESPONSE = 'ETHEREUM_PROVIDER_SCHEMA_RESPONSE',
}

/* eslint-disable no-restricted-syntax  */
const ExtensionResponseSchema = z
  .object({
    requestId: z.string(),
    result: z.any().optional(),
    error: z.any().optional(),
  })
  .refine((data) => data.result !== undefined || data.error !== undefined, {
    message: 'Either result or error must be defined',
  })

export type ExtensionResponse = z.infer<typeof ExtensionResponseSchema>

export const isValidExtensionResponse = (response: unknown): response is ExtensionResponse =>
  ExtensionResponseSchema.safeParse(response).success

const WindowEthereumRequestSchema = z.object({
  method: z.string(),
  params: z.any(),
  requestId: z.string(),
})
export type WindowEthereumRequest = z.infer<typeof WindowEthereumRequestSchema>

export const isValidWindowEthereumRequest = (request: unknown): request is WindowEthereumRequest =>
  WindowEthereumRequestSchema.safeParse(request).success

const ContentScriptToProxyEmissionSchema = z.object({
  emitKey: z.string(),
  emitValue: z.any(),
})

type ContentScriptToProxyEmission = z.infer<typeof ContentScriptToProxyEmissionSchema>

export const isValidContentScriptToProxyEmission = (request: unknown): request is ContentScriptToProxyEmission =>
  ContentScriptToProxyEmissionSchema.safeParse(request).success

const WindowEthereumConfigRequestSchema = z.object({
  type: z.literal(ETH_PROVIDER_CONFIG.REQUEST),
})

export type WindowEthereumConfigRequest = z.infer<typeof WindowEthereumConfigRequestSchema>

export const isValidWindowEthereumConfigRequest = (request: unknown): request is WindowEthereumConfigRequest =>
  WindowEthereumConfigRequestSchema.safeParse(request).success

const WindowEthereumConfigResponseSchema = z.object({
  type: z.literal(ETH_PROVIDER_CONFIG.RESPONSE),
  config: z.object({
    isDefaultProvider: z.boolean(),
  }),
})

export type WindowEthereumConfigResponse = z.infer<typeof WindowEthereumConfigResponseSchema>

export const isValidWindowEthereumConfigResponse = (request: unknown): request is WindowEthereumConfigResponse =>
  WindowEthereumConfigResponseSchema.safeParse(request).success
