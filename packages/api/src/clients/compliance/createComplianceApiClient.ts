import type {
  ComplianceApiClient,
  ComplianceApiClientContext,
  ScreenRequest,
  ScreenResponse,
} from '@universe/api/src/clients/compliance/types'

export type {
  ComplianceApiClient,
  ComplianceApiClientContext,
  ScreenRequest,
  ScreenResponse,
} from '@universe/api/src/clients/compliance/types'

const COMPLIANCE_API_PATHS = {
  screenAddress: '/uniswap.compliancev2service.v1.compliancev2Service/ScreenAddress',
}

export function createComplianceApiClient(ctx: ComplianceApiClientContext): ComplianceApiClient {
  const { baseUrl } = ctx

  const screenAddress = async (params: ScreenRequest): Promise<ScreenResponse> => {
    const response = await fetch(`${baseUrl}${COMPLIANCE_API_PATHS.screenAddress}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Compliance screen request failed: ${response.status} ${errorText}`)
    }
    return response.json() as Promise<ScreenResponse>
  }

  return {
    screenAddress,
  }
}
