export interface ScreenRequest {
  address: string
}

export interface ScreenResponse {
  block: boolean
}

export interface ComplianceApiClient {
  screenAddress: (params: ScreenRequest) => Promise<ScreenResponse>
}

export interface ComplianceApiClientContext {
  baseUrl: string
}
