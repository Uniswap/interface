import type { FetchClient } from '../base/types'
import {
  type JupiterExecuteResponse,
  type JupiterExecuteUrlParams,
  type JupiterOrderResponse,
  type JupiterOrderUrlParams,
  jupiterExecuteResponseSchema,
  jupiterOrderResponseSchema,
} from './types'
import { buildQuery } from './utils'

export interface JupiterApiClient {
  fetchOrder: (params: JupiterOrderUrlParams) => Promise<JupiterOrderResponse>
  execute: (params: JupiterExecuteUrlParams) => Promise<JupiterExecuteResponse>
}

export const JUPITER_API_PATHS = {
  order: '/order',
  execute: '/execute',
}

export function createJupiterApiClient(ctx: { fetchClient: FetchClient }): JupiterApiClient {
  async function fetchOrder(params: JupiterOrderUrlParams): Promise<JupiterOrderResponse> {
    const query = buildQuery(params)
    const result = await ctx.fetchClient.get(JUPITER_API_PATHS.order + '?' + query.toString())

    return jupiterOrderResponseSchema.parse(result)
  }

  async function execute(params: JupiterExecuteUrlParams): Promise<JupiterExecuteResponse> {
    const result = await ctx.fetchClient.post(JUPITER_API_PATHS.execute, {
      body: JSON.stringify(params),
    })

    return jupiterExecuteResponseSchema.parse(result)
  }

  return {
    fetchOrder,
    execute,
  }
}
