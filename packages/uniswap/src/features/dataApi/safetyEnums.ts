// Dependency-free on purpose: apps that can't take the @universe/api barrel import the safety
// vocabulary from here. safety.ts re-exports it for everyone else.

/**
 * Canonical app-domain token safety vocabulary, owned by dataApi (types.ts re-exports all of it). `SafetyInfo`/`CurrencyInfo` migrate onto these enums, and every
 * data source (REST protobuf, trading-api, v2 verdict strings) adapts *toward* them via the
 * mappers in safety.ts.
 *
 * String values are frozen: they are persisted and analytics-visible, and match the uppercase strings
 * the v1 REST endpoints serve (see parseSafetyLevel/parseProtectionResult).
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
