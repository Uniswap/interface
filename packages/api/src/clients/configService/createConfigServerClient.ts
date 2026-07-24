/**
 * Server-side Config Service Client
 *
 * Wraps the ConfigService gRPC-JSON API.
 * Only imported by server routes — never shipped to the browser.
 */

import { ENTRY_GATEWAY_API_BASE_URLS } from '@universe/api/src/clients/base/urls'
import { rpcPost } from '@universe/api/src/clients/configService/connectrpcClient'
import { Environment } from '@universe/environment'

// =============================================================================
// Constants
// =============================================================================

const SERVICE_PATH = 'configservice.v1.ConfigService'

// =============================================================================
// Types
// =============================================================================

export interface ListScopesResponse {
  scopePaths?: string[]
  scopes?: { scopePath?: string; allowedReviewers?: string[]; minimumReviewers?: number }[]
}

export interface ListParameterNamesResponse {
  parameterKeys?: string[]
}

export interface GetParameterValueResponse {
  value?: string
  author?: string
  updatedAt?: string
  paramType?: string
  jtdSchema?: string
}

/** Optional param type identifier + JTD (RFC 8927) schema stored alongside a value. */
export interface ParamTypeInfo {
  paramType?: string
  jtdSchema?: string
}

export interface SetParameterReply {
  success?: boolean
  minimumSignatureRequired?: number
}

export interface CreateScopeResponse {
  scopePath?: string
}

export interface UpdateScopeResponse {
  success?: boolean
  minimumReviewersRequired?: number
}

export interface GetProposedParamResponse {
  proposedParam?: string
  remainingSignatureRequired?: number
  author?: string
  proposedAt?: string // RFC3339 timestamp string
  approvers?: string[]
  operation?: string // "SET" or "DELETE"
  paramType?: string
  jtdSchema?: string
}

export interface ApproveProposedParamReply {
  success?: boolean
  remainingSignatureRequired?: number
}

export interface ProposedParamSummary {
  key?: string
  operation?: string // "SET" or "DELETE"
}

export interface GetProposedParamsInScopeResponse {
  /** @deprecated use parametersV2 */
  parameters?: string[]
  parametersV2?: ProposedParamSummary[]
}

export interface ParameterEntry {
  key?: string
  value?: string
  author?: string
  paramType?: string
  jtdSchema?: string
}

export interface GetParameterValuesInScopeResponse {
  parameters?: ParameterEntry[]
}

export interface DeleteParameterResponse {
  minimumSignatureRequired?: number
}

export interface ConfigServerClientConfig {
  environment: Environment
  apiToken: string
  /** Override the env-based hostname. Must include protocol, e.g. `http://localhost:3000`. */
  baseUrl?: string
}

// =============================================================================
// Factory
// =============================================================================

export type ConfigServerClient = ReturnType<typeof createConfigServerClient>

// oxlint-disable-next-line typescript/explicit-function-return-type
export function createConfigServerClient(config: ConfigServerClientConfig) {
  const baseUrl = config.baseUrl ?? ENTRY_GATEWAY_API_BASE_URLS[config.environment]
  const authHeaders = { Authorization: `Bearer ${config.apiToken}` }

  async function rpcCall<T>(method: string, body: unknown = {}): Promise<T> {
    try {
      return await rpcPost<T>(baseUrl, `/${SERVICE_PATH}/${method}`, authHeaders, body)
    } catch (error) {
      throw new Error(`${method} failed: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  return {
    async listScopes(): Promise<ListScopesResponse> {
      return rpcCall<ListScopesResponse>('ListScopes')
    },

    async listParameterNames(scopePath: string): Promise<ListParameterNamesResponse> {
      return rpcCall<ListParameterNamesResponse>('ListParameterNames', { scope_path: scopePath })
    },

    async getParameterValue(key: string): Promise<GetParameterValueResponse> {
      return rpcCall<GetParameterValueResponse>('GetParameterValue', { key })
    },

    async getParameterValuesInScope(scopePath: string): Promise<GetParameterValuesInScopeResponse> {
      return rpcCall<GetParameterValuesInScopeResponse>('GetParameterValuesInScope', { scope_path: scopePath })
    },

    // oxlint-disable-next-line max-params -- optional typeInfo mirrors the proto request fields
    async setParameter(key: string, value: string, typeInfo?: ParamTypeInfo): Promise<SetParameterReply> {
      return rpcCall<SetParameterReply>('SetParameter', {
        key,
        value,
        param_type: typeInfo?.paramType || undefined,
        jtd_schema: typeInfo?.jtdSchema || undefined,
      })
    },

    async deleteParameter(key: string): Promise<DeleteParameterResponse> {
      return rpcCall<DeleteParameterResponse>('DeleteParameter', { key })
    },

    async deleteScope(scopePath: string): Promise<void> {
      await rpcCall('DeleteScope', { scope_path: scopePath })
    },

    // oxlint-disable-next-line max-params -- verbatim signature from mission-control migration
    async createScope(
      serviceName: string,
      scopeName: string,
      allowedReviewers: string[],
      minimumReviewers: number,
    ): Promise<CreateScopeResponse> {
      return rpcCall<CreateScopeResponse>('CreateScope', {
        service_name: serviceName,
        scope_name: scopeName || undefined,
        allowed_reviewers: allowedReviewers,
        minimum_reviewers: minimumReviewers,
      })
    },

    // oxlint-disable-next-line max-params -- verbatim signature from mission-control migration
    async updateScope(
      scopePath: string,
      allowedReviewers: string[],
      minimumReviewers: number,
    ): Promise<UpdateScopeResponse> {
      return rpcCall<UpdateScopeResponse>('UpdateScope', {
        scope_path: scopePath,
        allowed_reviewers: allowedReviewers,
        minimum_reviewers: minimumReviewers,
      })
    },

    async getProposedParam(key: string): Promise<GetProposedParamResponse> {
      return rpcCall<GetProposedParamResponse>('GetProposedParam', { key })
    },

    async approveProposedParam(key: string): Promise<ApproveProposedParamReply> {
      return rpcCall<ApproveProposedParamReply>('ApproveProposedParam', { key })
    },

    async getProposedParamsInScope(scope: string): Promise<GetProposedParamsInScopeResponse> {
      return rpcCall<GetProposedParamsInScopeResponse>('GetProposedParamsInScope', { scope })
    },
  }
}
