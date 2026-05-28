// Email privacy
export { truncateEmail } from './email'

// Scrubbing
export type { Scrubber, ScrubberOptions, ScrubPattern } from './scrub'
export { createScrubber, DEFAULT_REDACT_PATHS, DEFAULT_SCRUB_PATTERNS } from './scrub'
