import { createPromiseClient, type PromiseClient, type Transport } from '@connectrpc/connect'
import { compliancev2Service } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_connect'
import { ChainId, type GatedFeature, TokenRef } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'

export type ComplianceV2Client = PromiseClient<typeof compliancev2Service>

/**
 * Builds a compliance v2 client over the given transport. Injected via
 * `ComplianceClientProvider` rather than held as a module singleton, so each app
 * supplies its own platform transport and tests can pass a stub.
 */
export function createComplianceV2Client(transport: Transport): ComplianceV2Client {
  return createPromiseClient(compliancev2Service, transport)
}

export type ComplianceTokenInput = {
  chainId: number
  address: string
}

export type ScreenAddressInput = {
  address: string
  /** Optional; omitting it (`CHAIN_ID_UNSPECIFIED`) routes to the default provider. */
  chainId?: number
}

/**
 * Builds a `useIsBlockedAddress` / `screenAddress` input from an optional address,
 * collapsing the repeated `address ? { address } : undefined` guard at call sites.
 * Pass `chainId` to route screening to that chain's provider; omit it to fall back
 * to `CHAIN_ID_UNSPECIFIED` (the default provider). Returns `undefined` (skip the
 * query) when there's no address to screen.
 */
export function toScreenInput(address?: string, chainId?: number): ScreenAddressInput | undefined {
  return address ? { address, chainId } : undefined
}

/**
 * Screens a wallet address against the compliance provider and returns whether
 * it should be blocked (e.g. sanctioned / OFAC-listed). `chainId` is optional —
 * leaving it out sends `CHAIN_ID_UNSPECIFIED`, which routes to the default provider.
 *
 * Fails open like the rest of this client: an unauthenticated caller (no Entry
 * Gateway session) is screened as not-blocked, so callers must treat `false` as
 * fail-open rather than a verified-clean signal.
 */
export async function screenAddress(
  client: ComplianceV2Client,
  { address, chainId }: ScreenAddressInput,
): Promise<boolean> {
  const response = await client.screenAddress({
    address,
    chainId: chainId as ChainId | undefined,
  })
  return response.block
}

/**
 * Bulk deny-list check for a single token. The endpoint accepts up to 100
 * tokens per call, but we keep calls scoped to one token so each result is
 * cached on its own `chainId:address` key.
 *
 * `includeNonBlockingReasons: true` keeps acknowledged tokens visible as
 * `ACKNOWLEDGED`; without it the server omits them after acknowledgement,
 * breaking the `REQUIRES_ACKNOWLEDGEMENT` → `ACKNOWLEDGED` flip.
 *
 * Returns the response `TokenRef` (with populated `reasons`) when the token is
 * blocked or acknowledged, or `undefined` when the API omits it (clean token).
 */
export async function fetchFeatureGatedToken(
  client: ComplianceV2Client,
  { chainId, address }: ComplianceTokenInput,
): Promise<TokenRef | undefined> {
  const response = await client.featureGatedTokens({
    tokens: [new TokenRef({ chainId: chainId as ChainId, address })],
    includeNonBlockingReasons: true,
  })
  return response.tokens[0]
}

/**
 * Records that the caller's Entry Gateway session has acknowledged a single
 * ack-gated token. Only valid for a token currently reporting
 * `REQUIRES_ACKNOWLEDGEMENT`; the server rejects hard-blocked or unmatched
 * tokens. The response is empty by design, so callers must re-read status via
 * `fetchFeatureGatedToken` (after invalidating its query) to observe the flip
 * to `ACKNOWLEDGED`.
 */
export async function setTokenAcknowledgement(
  client: ComplianceV2Client,
  { chainId, address }: ComplianceTokenInput,
): Promise<void> {
  await client.setTokenAcknowledgement({
    token: new TokenRef({ chainId: chainId as ChainId, address }),
  })
}

/**
 * Returns the product features geo-blocked for the caller's region. The region
 * is resolved server-side from the Entry Gateway request context (GeoIP); no
 * region input is sent. We pass an empty filter to fetch every blocked feature
 * in one call, so a single cache entry serves every `useIsFeatureGated` reader.
 *
 * Like the token surface, this fails open: an unauthenticated caller (no Entry
 * Gateway session) gets an empty list, which reads as "nothing gated".
 */
export async function fetchGatedFeatures(client: ComplianceV2Client): Promise<GatedFeature[]> {
  const response = await client.gatedFeatures({})
  return response.features
}
