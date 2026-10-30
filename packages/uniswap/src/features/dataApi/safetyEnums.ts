// Dependency-free on purpose: apps that can't take @universe/api (Apollo) import the safety
// vocabulary from here. safety.ts re-exports it for everyone else.

/**
 * Canonical app-domain token safety vocabulary, owned by dataApi (types.ts re-exports all of it). `SafetyInfo`/`CurrencyInfo` migrate onto these enums, and every
 * data source (REST protobuf, trading-api, v2 verdict strings, legacy GraphQL) adapts *toward*
 * them via the mappers in safety.ts — deleting GraphQL later deletes only its mapper.
 *
 * String values intentionally match the GraphQL wire values so the type flip cannot change any
 * persisted or analytics-visible strings.
 */
export enum SafetyLevel {
  Blocked = 'BLOCKED',
  MediumWarning = 'MEDIUM_WARNING',
  StrongWarning = 'STRONG_WARNING',
  Verified = 'VERIFIED',
}

export enum ProtectionResult {
  Benign = 'BENIGN',
  Malicious = 'MALICIOUS',
  Spam = 'SPAM',
  Unknown = 'UNKNOWN',
  Warning = 'WARNING',
}

export enum TokenList {
  Default = 'default',
  NonDefault = 'non_default',
  Blocked = 'blocked',
}

export enum AttackType {
  Honeypot = 'honeypot',
  ExitScamRisk = 'exit-scam-risk',
  Airdrop = 'airdrop',
  Impersonator = 'impersonator',
  HighFees = 'high-fees',
  Other = 'other',
}
