// Type-only import of the compat map's key union, so the type can't drift from it.
import type { SporeIconSizeToken } from './tokens'

/**
 * The legacy `$icon.N` size-token union (INFRA-3505): a closed union over the
 * `iconSize` map — no open residue, unlike `ColorTokens`.
 *
 * Interop/annotation type only — parameters, returns, locals.
 */
export type IconSizeTokens = SporeIconSizeToken
