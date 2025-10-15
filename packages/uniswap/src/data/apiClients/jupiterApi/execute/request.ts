import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  JupiterExecuteResponse,
  jupiterExecuteResponseSchema,
} from 'uniswap/src/data/apiClients/jupiterApi/execute/types'
import { JupiterApiClient } from 'uniswap/src/data/apiClients/jupiterApi/JupiterApiClient'

export async function execute(params: {
  signedTransaction: string
  requestId: string
}): Promise<JupiterExecuteResponse> {
  const result = await JupiterApiClient.post(uniswapUrls.jupiterApiPaths.execute, {
    body: JSON.stringify(params),
  })

  return jupiterExecuteResponseSchema.parse(result)
}
