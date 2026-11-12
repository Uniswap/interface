import { afterEach, describe, expect, it } from 'vitest'
import {
  captureEntryChunkCacheStatus,
  getEntryChunkCacheStatus,
  readEntryChunkCacheStatus,
  resolveEntryChunkUrl,
} from '~/app/bootstrap/entryChunkCacheStatus'

// Observed on app.uniswap.org, 2026-09-01: the module script the document loads the app from.
const PRODUCTION_ENTRY_CHUNK = 'https://app.uniswap.org/assets/index-BO8-ESVD.js'
// Observed on this branch's Vercel preview, same day, for the same entry.
const PREVIEW_ENTRY_CHUNK =
  'https://web-claude-infra-3082-web-cache-telemetry-uniswap.vercel.app/assets/index-BomPFjh6.js'
// Observed on app.uniswap.org, 2026-11-03: the entry chunk now loads from the CDN origin, which
// sends no `Timing-Allow-Origin`.
const CDN_ENTRY_CHUNK = 'https://cdn.app.uniswap.org/assets/index-CQVBIWoy.js'
const CDN_PUBLIC_MODULE_SCRIPT = 'https://cdn.app.uniswap.org/zone-events.js'
// A dedupe-suffixed chunk served alongside the entry on both pages, which must not be mistaken for it.
const PRODUCTION_DEDUPED_CHUNK = 'https://app.uniswap.org/assets/index-DQp_5KKJ-DsaqqNc1.js'
// The second module script both documents carry, from the public directory rather than the build.
const PUBLIC_MODULE_SCRIPT = 'https://app.uniswap.org/zone-events.js'
// The Create-React-App entry path this classification used to look for. The app builds with Vite,
// so nothing under /static/js is ever requested and every load reported 'unknown'.
const CRA_ENTRY_PATTERN = /\/static\/js\/main\.\w{8}\.js$/

describe('resolveEntryChunkUrl', () => {
  it('picks the built entry chunk over the public-directory module script', () => {
    expect(resolveEntryChunkUrl([PRODUCTION_ENTRY_CHUNK, PUBLIC_MODULE_SCRIPT])).toBe(PRODUCTION_ENTRY_CHUNK)
    expect(resolveEntryChunkUrl([PREVIEW_ENTRY_CHUNK, PUBLIC_MODULE_SCRIPT])).toBe(PREVIEW_ENTRY_CHUNK)
    expect(resolveEntryChunkUrl([CDN_ENTRY_CHUNK, CDN_PUBLIC_MODULE_SCRIPT])).toBe(CDN_ENTRY_CHUNK)
  })

  it('takes the first built module script in document order when none matches the convention', () => {
    const first = 'https://app.uniswap.org/assets/app-shell-Bpprpzce.js'
    const second = 'https://app.uniswap.org/assets/vendor-DsaqqNc1.js'
    expect(resolveEntryChunkUrl([first, second, PUBLIC_MODULE_SCRIPT])).toBe(first)
  })

  it('prefers the conventional entry name over another asset module script', () => {
    expect(resolveEntryChunkUrl(['https://app.uniswap.org/assets/vendor-Bpprpzce.js', PRODUCTION_ENTRY_CHUNK])).toBe(
      PRODUCTION_ENTRY_CHUNK,
    )
  })

  it('still resolves a sole entry whose filename stops following the convention', () => {
    const renamed = 'https://app.uniswap.org/assets/app-shell-Bpprpzce.js'
    expect(resolveEntryChunkUrl([renamed, PUBLIC_MODULE_SCRIPT])).toBe(renamed)
  })

  it('returns undefined when the document exposes no built module script', () => {
    expect(resolveEntryChunkUrl([PUBLIC_MODULE_SCRIPT])).toBeUndefined()
    expect(resolveEntryChunkUrl(['not a url'])).toBeUndefined()
    expect(resolveEntryChunkUrl([])).toBeUndefined()
  })
})

describe('getEntryChunkCacheStatus with the entry URL read from the document', () => {
  it('reports a hit when the entry chunk transferred no bytes', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: PRODUCTION_ENTRY_CHUNK, transferSize: 0 }],
        entryChunkUrl: PRODUCTION_ENTRY_CHUNK,
      }),
    ).toBe('hit')
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: PREVIEW_ENTRY_CHUNK, transferSize: 0 }],
        entryChunkUrl: PREVIEW_ENTRY_CHUNK,
      }),
    ).toBe('hit')
  })

  it('reports a miss when the entry chunk crossed the network', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: PRODUCTION_ENTRY_CHUNK, transferSize: 214_512 }],
        entryChunkUrl: PRODUCTION_ENTRY_CHUNK,
      }),
    ).toBe('miss')
  })

  it('picks the entry chunk out of a page full of other resources', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [
          { name: 'https://app.uniswap.org/assets/rolldown-runtime-Bpprpzce.js', transferSize: 4096 },
          { name: PRODUCTION_DEDUPED_CHUNK, transferSize: 8192 },
          { name: PRODUCTION_ENTRY_CHUNK, transferSize: 0 },
        ],
        entryChunkUrl: PRODUCTION_ENTRY_CHUNK,
      }),
    ).toBe('hit')
  })

  it('does not accept a dedupe-suffixed sibling as the entry chunk', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: PRODUCTION_DEDUPED_CHUNK, transferSize: 0 }],
        entryChunkUrl: PRODUCTION_ENTRY_CHUNK,
      }),
    ).toBe('unknown')
  })

  it('reports unknown without throwing when the entry chunk has no timing', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: PUBLIC_MODULE_SCRIPT, transferSize: 0 }],
        entryChunkUrl: PRODUCTION_ENTRY_CHUNK,
      }),
    ).toBe('unknown')
    expect(getEntryChunkCacheStatus({ resourceTimings: [], entryChunkUrl: PRODUCTION_ENTRY_CHUNK })).toBe('unknown')
  })

  it('reports an opaque timing rather than a hit for a cross-origin entry chunk without Timing-Allow-Origin', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: CDN_ENTRY_CHUNK, transferSize: 0, responseStart: 0 }],
        entryChunkUrl: CDN_ENTRY_CHUNK,
      }),
    ).toBe('opaque_timing')
  })

  it('still classifies a cross-origin entry chunk whose timing is exposed', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: CDN_ENTRY_CHUNK, transferSize: 0, responseStart: 182.4 }],
        entryChunkUrl: CDN_ENTRY_CHUNK,
      }),
    ).toBe('hit')
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: CDN_ENTRY_CHUNK, transferSize: 214_512, responseStart: 182.4 }],
        entryChunkUrl: CDN_ENTRY_CHUNK,
      }),
    ).toBe('miss')
  })

  it('distinguishes a timing that reports no transfer size from a missing timing', () => {
    expect(
      getEntryChunkCacheStatus({
        resourceTimings: [{ name: PRODUCTION_ENTRY_CHUNK }],
        entryChunkUrl: PRODUCTION_ENTRY_CHUNK,
      }),
    ).toBe('no_transfer_size')
  })
})

describe('getEntryChunkCacheStatus falling back to the entry chunk filename shape', () => {
  it('classifies the production entry chunk with no entry URL available', () => {
    expect(getEntryChunkCacheStatus({ resourceTimings: [{ name: PRODUCTION_ENTRY_CHUNK, transferSize: 0 }] })).toBe(
      'hit',
    )
    expect(getEntryChunkCacheStatus({ resourceTimings: [{ name: PREVIEW_ENTRY_CHUNK, transferSize: 9001 }] })).toBe(
      'miss',
    )
  })

  it('reports an opaque timing for the cross-origin entry chunk with no entry URL available', () => {
    expect(
      getEntryChunkCacheStatus({ resourceTimings: [{ name: CDN_ENTRY_CHUNK, transferSize: 0, responseStart: 0 }] }),
    ).toBe('opaque_timing')
  })

  it('ignores the dedupe-suffixed sibling and the public-directory script', () => {
    expect(getEntryChunkCacheStatus({ resourceTimings: [{ name: PRODUCTION_DEDUPED_CHUNK, transferSize: 0 }] })).toBe(
      'unknown',
    )
    expect(getEntryChunkCacheStatus({ resourceTimings: [{ name: PUBLIC_MODULE_SCRIPT, transferSize: 0 }] })).toBe(
      'unknown',
    )
  })

  it('pins the regression: the Create-React-App pattern matched neither deployed entry chunk', () => {
    expect(CRA_ENTRY_PATTERN.test(PRODUCTION_ENTRY_CHUNK)).toBe(false)
    expect(CRA_ENTRY_PATTERN.test(PREVIEW_ENTRY_CHUNK)).toBe(false)
  })
})

// Runs before anything captures a status, so the fallback read is the one exercised.
describe('readEntryChunkCacheStatus with nothing captured', () => {
  const performanceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance')

  afterEach(() => {
    if (performanceDescriptor) {
      Object.defineProperty(globalThis, 'performance', performanceDescriptor)
    }
  })

  it('reports unknown rather than throwing into the caller', () => {
    Object.defineProperty(globalThis, 'performance', {
      configurable: true,
      get() {
        throw new Error('performance is not available')
      },
    })
    expect(readEntryChunkCacheStatus).not.toThrow()
    expect(readEntryChunkCacheStatus()).toBe('unknown')
  })
})

// These share the module's captured-status state, so they run last and in this order.
describe('captureEntryChunkCacheStatus', () => {
  it('reports the captured status afterwards', () => {
    captureEntryChunkCacheStatus(() => 'hit')
    expect(readEntryChunkCacheStatus()).toBe('hit')
  })

  it('swallows a failed read so a bootstrap statement cannot abort the app', () => {
    expect(() =>
      captureEntryChunkCacheStatus(() => {
        throw new Error('performance is not available')
      }),
    ).not.toThrow()
    expect(readEntryChunkCacheStatus()).toBe('unknown')
  })
})
