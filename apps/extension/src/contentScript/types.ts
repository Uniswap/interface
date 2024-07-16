import { z } from 'zod'

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

export const WindowEthereumRequestSchema = z.object({
  method: z.string(),
  params: z.any(),
  requestId: z.string(),
})
export type WindowEthereumRequest = z.infer<typeof WindowEthereumRequestSchema>

export const isValidWindowEthereumRequest = (request: unknown): request is WindowEthereumRequest =>
  WindowEthereumRequestSchema.safeParse(request).success

export const ContentScriptToProxyEmissionSchema = z.object({
  emitKey: z.string(),
  emitValue: z.any(),
})

export type ContentScriptToProxyEmission = z.infer<typeof ContentScriptToProxyEmissionSchema>

export const isValidContentScriptToProxyEmission = (request: unknown): request is ContentScriptToProxyEmission =>
  ContentScriptToProxyEmissionSchema.safeParse(request).success
