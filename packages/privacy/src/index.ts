// Email privacy
export { truncateEmail } from './email'

// Scrubbing
export type { Scrubber, ScrubberOptions, ScrubPattern, SensitiveFieldFinder } from './scrub'
export {
  createScrubber,
  createSensitiveFieldFinder,
  DEFAULT_REDACT_PATHS,
  DEFAULT_SCRUB_PATTERNS,
  WALLET_SECRET_REDACT_PATHS,
} from './scrub'
