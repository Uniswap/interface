/**
 * Server-side Secrets Service Client
 *
 * Wraps the SecretsService gRPC-JSON API.
 * Only imported by server routes — never shipped to the browser.
 */

import { ENTRY_GATEWAY_API_BASE_URLS } from '@universe/api/src/clients/base/urls'
import { rpcPost } from '@universe/api/src/clients/configService/connectrpcClient'
import { Environment } from '@universe/environment'

// =============================================================================
// Constants
// =============================================================================

const SERVICE_PATH = 'configservice.v1.SecretsService'

// =============================================================================
// Types
// =============================================================================

export interface SecretMetadataResponse {
  name?: string
  description?: string
  keyCount?: number
  lastModified?: string
}

export interface ListSecretsResponse {
  secrets?: SecretMetadataResponse[]
}

export interface GetSecretValueResponse {
  secretName?: string
  description?: string
  data?: Record<string, string>
  reviewers?: string[]
  lastModified?: string
}

export interface SecretChangeReply {
  minimumSignatureRequired?: number
}

export interface ApproveSecretChangeReply {
  remainingSignatureRequired?: number
}

export interface GetProposedSecretChangesInScopeResponse {
  changeKeys?: string[]
}

export interface GetProposedSecretChangeResponse {
  secretName?: string
  data?: Record<string, string>
  operation?: string
  author?: string
  proposedAt?: string
  approvers?: string[]
  remainingSignatureRequired?: number
}

export interface SecretsServerClientConfig {
  environment: Environment
  apiToken: string
  /** Override the env-based hostname. Must include protocol, e.g. `http://localhost:3000`. */
  baseUrl?: string
}

// =============================================================================
// Factory
// =============================================================================

export type SecretsServerClient = ReturnType<typeof createSecretsServerClient>

// oxlint-disable-next-line typescript/explicit-function-return-type
export function createSecretsServerClient(config: SecretsServerClientConfig) {
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
    // oxlint-disable-next-line max-params -- verbatim signature from mission-control migration
    async setSecretValue(
      secretName: string,
      data: Record<string, string>,
      description: string,
    ): Promise<SecretChangeReply> {
      return rpcCall<SecretChangeReply>('SetSecretValue', { secret_name: secretName, data, description })
    },

    async listSecrets(prefix: string): Promise<ListSecretsResponse> {
      return rpcCall<ListSecretsResponse>('ListSecrets', { prefix })
    },

    async getSecretValue(secretName: string): Promise<GetSecretValueResponse> {
      return rpcCall<GetSecretValueResponse>('GetSecretValue', { secret_name: secretName })
    },

    async deleteSecret(secretName: string): Promise<SecretChangeReply> {
      return rpcCall<SecretChangeReply>('DeleteSecret', { secret_name: secretName })
    },

    async getProposedSecretChangesInScope(scope: string): Promise<GetProposedSecretChangesInScopeResponse> {
      return rpcCall<GetProposedSecretChangesInScopeResponse>('GetProposedSecretChangesInScope', { scope })
    },

    async getProposedSecretChange(changeKey: string): Promise<GetProposedSecretChangeResponse> {
      return rpcCall<GetProposedSecretChangeResponse>('GetProposedSecretChange', { change_key: changeKey })
    },

    async approveProposedSecretChange(changeKey: string): Promise<ApproveSecretChangeReply> {
      return rpcCall<ApproveSecretChangeReply>('ApproveProposedSecretChange', { change_key: changeKey })
    },
  }
}
