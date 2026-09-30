import { CHAIN_METADATA, UniverseChainId } from '@universe/chains'

/**
 * Canonical chain-ID → URL-param mapping, derived from `CHAIN_METADATA`
 * (the web-safe table in `@universe/chains`) so the slug has one home.
 *
 * Typed as `Record<UniverseChainId, string>` so the build breaks whenever a new
 * chain is added to the enum without a corresponding URL param.
 *
 * This module's own graph is just the enum and the metadata table, but it reaches
 * them through the `@universe/chains` barrel, which value-exports the RPC and
 * transaction stack (viem, ethers, ViemClientManager, FlashbotsRpcProvider). A
 * bundler drops that via `sideEffects: false`; a non-bundled runtime loading the
 * barrel pays for all of it. Before importing this from a lightweight runtime
 * (e.g. a Cloudflare Worker), give `@universe/chains` a subpath export for the
 * metadata module rather than relying on tree-shaking.
 */
export const CHAIN_ID_TO_URL_PARAM: Record<UniverseChainId, string> = Object.fromEntries(
  Object.entries(CHAIN_METADATA).map(([id, meta]) => [id, meta.urlParam]),
) as Record<UniverseChainId, string>

/** Reverse mapping: URL-param → chain ID (built once, O(1) lookup). */
export const URL_PARAM_TO_CHAIN_ID: Record<string, UniverseChainId> = Object.fromEntries(
  Object.entries(CHAIN_ID_TO_URL_PARAM).map(([id, param]) => [param, Number(id) as UniverseChainId]),
) as Record<string, UniverseChainId>
