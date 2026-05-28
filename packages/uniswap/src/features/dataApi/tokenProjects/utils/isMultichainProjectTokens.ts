/**
 * True when a token project has more than one on-chain deployment (multichain asset).
 */
export function isMultichainProjectTokens(tokens: readonly unknown[] | null | undefined): boolean {
  return (tokens?.length ?? 0) > 1
}
