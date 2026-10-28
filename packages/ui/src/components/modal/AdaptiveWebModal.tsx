/**
 * Base (unsuffixed) leg, required by the platform-split pairing convention: web bundlers resolve
 * `AdaptiveWebModal.web.tsx`; everything else needs this name to exist. The implementation lives
 * in the `.native` leg — a base file cannot re-export its own unsuffixed name (platform
 * resolution would resolve it back to a platform leg), so it re-exports the native leg by
 * explicit suffix.
 */
export * from './AdaptiveWebModal.native'
