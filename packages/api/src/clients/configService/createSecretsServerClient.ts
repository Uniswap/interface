/**
 * Server-side Secrets Service Client
 *
 * Wraps the SecretsService gRPC-JSON API.
 * Only imported by server routes — never shipped to the browser.
 */

import { Environment } from '@universe/environment'
import { ENTRY_GATEWAY_API_BASE_URLS } from '../base/urls'
import { rpcPost } from './connectrpcClient'

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

// -----------------------------------------------------------------------------
// Per-key secret proposals
//
// Many proposals can be pending on one secret at once, each a partial (per-key)
// delta addressed by its own `proposalId`. Applying a proposal merges its delta
// onto the secret's current data, so proposals on different keys compose instead
// of overwriting one another (the whole-secret RPCs above still work).
// -----------------------------------------------------------------------------

/** Sets `key` to `value`. There is no per-key delete; removing a key is a whole-secret SetSecretValue. */
export interface SecretKeyChange {
  key: string
  /** Always sent; may be absent on the wire in replies, since proto JSON omits an empty string. */
  value?: string
}

export interface ProposeSecretChangeReply {
  proposalId?: string
  minimumSignatureRequired?: number
}

export interface SecretChangeProposalSummary {
  proposalId?: string
  /** Which secret in the scope this proposal targets (full name, no leading slash). */
  secretName?: string
  author?: string
  /** Changed key names only — no values. */
  changedKeys?: string[]
  remainingSignatureRequired?: number
  proposedAt?: string
}

export interface ListProposedSecretChangesInScopeResponse {
  proposals?: SecretChangeProposalSummary[]
}

export interface GetProposedSecretChangeByIdResponse {
  proposalId?: string
  secretName?: string
  author?: string
  /** Full per-key delta, with values. */
  changes?: SecretKeyChange[]
  approvers?: string[]
  remainingSignatureRequired?: number
  proposedAt?: string
}

export interface ApproveProposedSecretChangeByIdReply {
  /** True once quorum is met and the delta has been applied. */
  applied?: boolean
  remainingSignatureRequired?: number
}

export interface RejectProposedSecretChangeByIdReply {
  success?: boolean
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
      // Preserve the original error as `cause` so `isRpcNotFound`/`rpcHttpStatus`
      // can still walk to the underlying `RpcHttpError` — a service that folds
      // absence into `null` must tell 404-not-found apart from an unrouted path.
      throw new Error(`${method} failed: ${error instanceof Error ? error.message : 'unknown error'}`, {
        cause: error,
      })
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

    // --- Per-key proposals ---------------------------------------------------

    // oxlint-disable-next-line max-params -- (name, changes, description) mirrors setSecretValue
    async proposeSecretChange(
      secretName: string,
      changes: SecretKeyChange[],
      description: string,
    ): Promise<ProposeSecretChangeReply> {
      return rpcCall<ProposeSecretChangeReply>('ProposeSecretChange', {
        secret_name: secretName,
        changes,
        description,
      })
    },

    async listProposedSecretChangesInScope(scope: string): Promise<ListProposedSecretChangesInScopeResponse> {
      return rpcCall<ListProposedSecretChangesInScopeResponse>('ListProposedSecretChangesInScope', { scope })
    },

    async getProposedSecretChangeById(
      secretName: string,
      proposalId: string,
    ): Promise<GetProposedSecretChangeByIdResponse> {
      return rpcCall<GetProposedSecretChangeByIdResponse>('GetProposedSecretChangeById', {
        secret_name: secretName,
        proposal_id: proposalId,
      })
    },

    async approveProposedSecretChangeById(
      secretName: string,
      proposalId: string,
    ): Promise<ApproveProposedSecretChangeByIdReply> {
      return rpcCall<ApproveProposedSecretChangeByIdReply>('ApproveProposedSecretChangeById', {
        secret_name: secretName,
        proposal_id: proposalId,
      })
    },

    async rejectProposedSecretChangeById(
      secretName: string,
      proposalId: string,
    ): Promise<RejectProposedSecretChangeByIdReply> {
      return rpcCall<RejectProposedSecretChangeByIdReply>('RejectProposedSecretChangeById', {
        secret_name: secretName,
        proposal_id: proposalId,
      })
    },
  }
}
