import type { FetchClient } from '@universe/api/src/clients/base/types'
import { logger } from 'utilities/src/logger/logger'

export const DATA_SERVICE_API_PATHS = {
  report: '/SubmitReport',
}

export interface DataServiceApiClientContext {
  fetchClient: FetchClient
}

export interface DataServiceApiClient {
  submitTokenReport: (params: SubmitTokenReportParams) => Promise<void>
}

export function createDataServiceApiClient(ctx: DataServiceApiClientContext): DataServiceApiClient {
  const { fetchClient } = ctx
  return {
    submitTokenReport: (params: SubmitTokenReportParams) => submitTokenReport({ ...params, fetchClient }),
  }
}

/**
 * Defines the types of events that can be reported for a token.
 */
export enum TokenReportEventType {
  // Reported when a token/NFT is spam but not marked as such.
  FalseNegative = 'TOKEN_REPORT_EVENT_TYPE_FALSE_NEGATIVE',
  // Reported when a token/NFT is marked as spam but is not.
  FalsePositive = 'TOKEN_REPORT_EVENT_TYPE_FALSE_POSITIVE',
}

export enum ReportAssetType {
  Token = 'Token',
  NFT = 'NFT',
}

interface SubmitReportRequestBody {
  chainId: number
  address: string
  event: TokenReportEventType
  details: string
}

interface SubmitTokenReportParams {
  chainId: number
  address: string
  event: TokenReportEventType
  assetType: ReportAssetType
}

interface SubmitReportResponse {
  success: boolean
}

const ASSET_TO_REPORT_STRING = {
  [ReportAssetType.Token]: 'User reported as a spam token',
  [ReportAssetType.NFT]: 'User reported as a spam NFT',
}

/**
 * Submits a report about a token (e.g., marking spam or correcting a false spam flag).
 * @param chainId The chain ID where the token resides.
 * @param address The address of the token contract.
 * @param event The type of report event (FalseNegative or FalsePositive).
 */
async function submitTokenReport({
  chainId,
  address,
  event,
  assetType,
  fetchClient,
}: SubmitTokenReportParams & { fetchClient: FetchClient }): Promise<void> {
  const requestBody: SubmitReportRequestBody = {
    chainId,
    address,
    event,
    details: ASSET_TO_REPORT_STRING[assetType],
  }

  try {
    logger.debug('DataApiClient', 'submitTokenReport', `Submitting report: ${JSON.stringify(requestBody)}`)

    const responseData = await fetchClient.post<SubmitReportResponse>(DATA_SERVICE_API_PATHS.report, {
      body: JSON.stringify(requestBody),
    })

    if (!responseData.success) {
      throw new Error('API Error: Report submission indicated failure')
    }

    logger.debug('DataApiClient', 'submitTokenReport', 'Report submitted successfully')
  } catch (error) {
    logger.error(error, {
      tags: { file: 'createDataServiceApiClient.ts', function: 'submitTokenReport' },
      extra: { url: `${fetchClient.context().baseUrl}${DATA_SERVICE_API_PATHS.report}`, requestBody },
    })
    // Re-throw the error caught from createApiClient or handle it
    throw error
  }
}
