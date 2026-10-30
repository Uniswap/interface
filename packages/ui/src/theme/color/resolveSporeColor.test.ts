import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import { resolveSporeColor } from 'ui/src/theme/color/resolveSporeColor'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setDatadogEnabled: vi.fn(),
  },
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: mockLogger,
}))

// The unknown-token warning fires in every non-prod env (dev + staging QA);
// force non-prod so the suite exercises the warning path. The helper caches
// the env check after the first resolve, so the mock must be in place before
// any call — module-level vi.mock guarantees that.
vi.mock('@universe/environment', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isProdEnv: (): boolean => false,
}))

// SAFETY: a two-token slice of the theme map is enough surface for the
// helper's `token in colors` lookup; the remaining theme keys are never read.
const colors = {
  surface1: { val: '#FFFFFF', variable: 'var(--surface1)', get: (): string => 'var(--surface1)' },
  neutral1: { val: '#131313', variable: 'var(--neutral1)', get: (): string => 'var(--neutral1)' },
} as unknown as UseSporeColorsReturn

describe(resolveSporeColor, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves a $-prefixed token through the provided theme', () => {
    expect(resolveSporeColor(colors, '$surface1')).toBe('#FFFFFF')
    expect(resolveSporeColor(colors, '$neutral1')).toBe('#131313')
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('passes a raw color through verbatim without warning', () => {
    expect(resolveSporeColor(colors, '#123456')).toBe('#123456')
    expect(resolveSporeColor(colors, 'rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)')
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('passes an unknown $-token through verbatim and warns in non-prod', () => {
    expect(resolveSporeColor(colors, '$notARealToken')).toBe('$notARealToken')
    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'color/resolveSporeColor',
      'resolveSporeColor',
      expect.stringContaining('$notARealToken'),
    )
  })
})
