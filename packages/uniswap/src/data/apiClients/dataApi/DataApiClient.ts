import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'

const dataApiClient = createApiClient({
  baseUrl: uniswapUrls.dataApiServiceUrl,
})

/**
 * Defines the types of events that can be reported for a token.
 */
export enum TokenReportEventType {
  // Reported when a token/NFT is spam but not marked as such.
  FalseNegative = 'TOKEN_REPORT_EVENT_TYPE_FALSE_NEGATIVE',
  // Reported when a token/NFT is marked as spam but is not.
  FalsePositive = 'TOKEN_REPORT_EVENT_TYPE_FALSE_POSITIVE',
}

interface SubmitReportRequestBody {
  chainId: number
  address: string
  event: TokenReportEventType
  details: string
}

interface SubmitTokenReportParams {
  chainId: UniverseChainId
  address: string
  event: TokenReportEventType
}

interface SubmitReportResponse {
  success: boolean
}

/**
 * Submits a report about a token (e.g., marking spam or correcting a false spam flag).
 * @param chainId The chain ID where the token resides.
 * @param address The address of the token contract.
 * @param event The type of report event (FalseNegative or FalsePositive).
 */
export async function submitTokenReport({ chainId, address, event }: SubmitTokenReportParams): Promise<void> {
  const requestBody: SubmitReportRequestBody = {
    chainId,
    address,
    event,
    details: 'User reported as a spam NFT',
  }

  try {
    logger.debug('DataApiClient', 'submitTokenReport', `Submitting report: ${JSON.stringify(requestBody)}`)

    const responseData = await dataApiClient.post<SubmitReportResponse>(uniswapUrls.dataApiServicePaths.report, {
      body: JSON.stringify(requestBody),
    })

    if (!responseData.success) {
      throw new Error('API Error: Report submission indicated failure')
    }

    logger.debug('DataApiClient', 'submitTokenReport', 'Report submitted successfully')
  } catch (error) {
    logger.error(error, {
      tags: { file: 'DataApiClient.ts', function: 'submitTokenReport' },
      extra: { url: `${uniswapUrls.dataApiServiceUrl}${uniswapUrls.dataApiServicePaths.report}`, requestBody },
    })
    // Re-throw the error caught from createApiClient or handle it
    throw error
  }
}
