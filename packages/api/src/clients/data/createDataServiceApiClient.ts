import type { FetchClient } from '@universe/api/src/clients/base/types'
import { logger } from 'utilities/src/logger/logger'

export const DATA_SERVICE_API_PATHS = {
  report: '/SubmitReport',
  dataReport: '/SubmitDataReport',
}

export interface DataServiceApiClientContext {
  fetchClient: FetchClient
}

export interface DataServiceApiClient {
  submitTokenReport: (params: SubmitTokenReportParams) => Promise<void>
  submitDataReport: (params: SubmitDataReportParams) => Promise<void>
}

export function createDataServiceApiClient(ctx: DataServiceApiClientContext): DataServiceApiClient {
  const { fetchClient } = ctx
  return {
    submitTokenReport: (params: SubmitTokenReportParams) => submitTokenReport({ ...params, fetchClient }),
    submitDataReport: (params: SubmitDataReportParams) => submitDataReport({ ...params, fetchClient }),
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

export type DataReportType = 'token' | 'wallet'

export interface SubmitDataReportParams {
  reportType: DataReportType
  tag: string
  details?: string
  walletAddress: string
  chainId?: number
  tokenAddress?: string
  multichain?: boolean
}

interface SubmitDataReportRequestBody {
  reportType: string
  tag: string
  details?: string
  walletAddress: string
  chainId?: number
  tokenAddress?: string
  multichain?: boolean
}

interface SubmitReportRequestBody {
  chainId: number
  address: string
  event: TokenReportEventType
  details: string
  multichain?: boolean
}

interface SubmitTokenReportParams {
  chainId: number
  address: string
  event: TokenReportEventType
  assetType: ReportAssetType
  multichain?: boolean
}

interface SubmitReportResponse {
  success: boolean
}

const ASSET_TO_REPORT_STRING = {
  [ReportAssetType.Token]: 'User reported as a spam token',
  [ReportAssetType.NFT]: 'User reported as a spam NFT',
}

async function submitDataReport({
  reportType,
  tag,
  details,
  walletAddress,
  chainId,
  tokenAddress,
  multichain,
  fetchClient,
}: SubmitDataReportParams & { fetchClient: FetchClient }): Promise<void> {
  const requestBody: SubmitDataReportRequestBody = {
    reportType,
    tag,
    walletAddress,
    ...(details && { details }),
    ...(chainId !== undefined && { chainId }),
    ...(tokenAddress && { tokenAddress }),
    ...(multichain === true && { multichain: true }),
  }

  try {
    logger.debug('DataApiClient', 'submitDataReport', `Submitting data report: ${JSON.stringify(requestBody)}`)

    const responseData = await fetchClient.post<SubmitReportResponse>(DATA_SERVICE_API_PATHS.dataReport, {
      body: JSON.stringify(requestBody),
    })

    if (!responseData.success) {
      throw new Error('API Error: Data report submission indicated failure')
    }

    logger.debug('DataApiClient', 'submitDataReport', 'Data report submitted successfully')
  } catch (error) {
    logger.error(error, {
      tags: { file: 'createDataServiceApiClient.ts', function: 'submitDataReport' },
      extra: { url: `${fetchClient.context().baseUrl}${DATA_SERVICE_API_PATHS.dataReport}`, requestBody },
    })
    throw error
  }
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
  multichain,
  fetchClient,
}: SubmitTokenReportParams & { fetchClient: FetchClient }): Promise<void> {
  const requestBody: SubmitReportRequestBody = {
    chainId,
    address,
    event,
    details: ASSET_TO_REPORT_STRING[assetType],
    ...(multichain === true && { multichain: true }),
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
