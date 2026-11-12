/** The subset of a `PerformanceResourceTiming` that cache classification reads. */
interface ResourceTiming {
  readonly name: string
  /** Absent on timeline entries that are not resource timings, and on browsers that do not report it. */
  readonly transferSize?: number
  /** Absent on timeline entries that are not resource timings. */
  readonly responseStart?: number
}

export type EntryChunkCacheStatus = 'hit' | 'miss' | 'no_transfer_size' | 'opaque_timing' | 'unknown'

/** Hashed build output lives here; `/zone-events.js` and other public-directory scripts do not. */
const ENTRY_CHUNK_DIRECTORY = '/assets/'

/**
 * Shape of the Vite entry chunk, `assets/index-<hash>.js` per `rollupOptions.output.entryFileNames`.
 * Hardcoding a bundler naming convention is what made this measurement rot, so this is only the
 * fallback for a document that exposes no module script to read the real URL from. The hash length
 * is a bundler detail, so the pattern accepts a range; that bound also excludes dedupe-suffixed
 * chunks, which carry a second hash segment (production serves both `/assets/index-BO8-ESVD.js`
 * and `/assets/index-DQp_5KKJ-DsaqqNc1.js`).
 */
const ENTRY_CHUNK_PATH_FALLBACK = /\/assets\/index-[A-Za-z0-9_-]{6,12}\.js$/

function pathnameOf(url: string): string | undefined {
  try {
    return new URL(url).pathname
  } catch {
    return undefined
  }
}

function isBuiltModuleScript(source: string): boolean {
  const pathname = pathnameOf(source)
  return pathname !== undefined && pathname.startsWith(ENTRY_CHUNK_DIRECTORY) && pathname.endsWith('.js')
}

/**
 * Picks the URL the app's entry chunk was loaded from out of the document's module script sources.
 *
 * Selection is narrowed to the hashed asset directory because the document also carries a module
 * script from the public directory. Among those, a source matching the entry chunk's expected
 * filename wins, so a stray asset module script cannot be mistaken for the entry; if none matches,
 * the first built module script in document order wins, which is what keeps a renamed entry
 * resolvable rather than silently unmeasurable.
 *
 * @param scriptSources - resolved `src` values of the document's `<script type="module">` elements,
 * in document order.
 * @returns the entry chunk's URL, or `undefined` when the document exposes no built module script.
 */
export function resolveEntryChunkUrl(scriptSources: readonly string[]): string | undefined {
  const builtModuleScripts = scriptSources.filter(isBuiltModuleScript)
  return builtModuleScripts.find((source) => ENTRY_CHUNK_PATH_FALLBACK.test(source)) ?? builtModuleScripts[0]
}

/**
 * Classifies whether this page load served the app's entry chunk from the browser cache.
 *
 * @param args.resourceTimings - the document's resource timings.
 * @param args.entryChunkUrl - the entry chunk's URL when the document exposed it, matched exactly;
 * when absent, timings are matched against the entry chunk's expected filename shape instead.
 * @returns `'hit'` when the entry chunk was replayed from cache, `'miss'` when it crossed the
 * network, `'no_transfer_size'` when its timing carries no transfer size to judge by,
 * `'opaque_timing'` when it was served cross-origin without `Timing-Allow-Origin`, and `'unknown'`
 * when no timing for the entry chunk is present at all.
 */
export function getEntryChunkCacheStatus(args: {
  resourceTimings: readonly ResourceTiming[]
  entryChunkUrl?: string
}): EntryChunkCacheStatus {
  const { resourceTimings, entryChunkUrl } = args
  const entryChunk = resourceTimings.find((timing) =>
    entryChunkUrl === undefined ? ENTRY_CHUNK_PATH_FALLBACK.test(timing.name) : timing.name === entryChunkUrl,
  )
  if (!entryChunk) {
    return 'unknown'
  }
  if (typeof entryChunk.transferSize !== 'number') {
    return 'no_transfer_size'
  }
  // A cross-origin timing without `Timing-Allow-Origin` zeroes `transferSize` along with
  // `responseStart`, so a 0 transfer size there says nothing about the cache.
  if (entryChunk.responseStart === 0) {
    return 'opaque_timing'
  }
  // A response replayed from the HTTP cache transfers no bytes.
  return entryChunk.transferSize === 0 ? 'hit' : 'miss'
}

function classifyFromBrowser(): EntryChunkCacheStatus {
  const scriptSources = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')).map(
    (script) => script.src,
  )
  return getEntryChunkCacheStatus({
    resourceTimings: performance.getEntriesByType('resource'),
    entryChunkUrl: resolveEntryChunkUrl(scriptSources),
  })
}

let capturedStatus: EntryChunkCacheStatus | undefined

/**
 * Captures this page load's entry chunk cache status for later reporting.
 *
 * Belongs in early bootstrap, because the resource timing buffer is not durable: the deployed
 * document module-preloads roughly 700 hashed chunks against a 250-entry default buffer, and the
 * Datadog RUM SDK responds to `resourcetimingbufferfull` by calling `clearResourceTimings()`. The
 * entry chunk's timing is recorded when it finishes downloading, so it is already available to the
 * first line of app code that runs; reading it there rather than at render time is what keeps a
 * later clear from erasing the measurement.
 *
 * @param classify - how to read the status; the default reads the live document and timeline.
 */
export function captureEntryChunkCacheStatus(classify: () => EntryChunkCacheStatus = classifyFromBrowser): void {
  try {
    capturedStatus = classify()
  } catch {
    // This runs as a top-level bootstrap statement, where a throw would abort entry-module
    // evaluation and leave the app unmounted. A lost data point is the cheaper outcome.
    capturedStatus = 'unknown'
  }
}

/**
 * This page load's entry chunk cache status.
 *
 * @returns the status captured in bootstrap, a status read now when nothing captured one, or
 * `'unknown'` when reading it fails.
 */
export function readEntryChunkCacheStatus(): EntryChunkCacheStatus {
  if (capturedStatus !== undefined) {
    return capturedStatus
  }
  try {
    return classifyFromBrowser()
  } catch {
    // Callers report analytics events off the returned status, so a failed read must not take those
    // events down with it.
    return 'unknown'
  }
}
