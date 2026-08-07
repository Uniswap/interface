import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useShareAction } from '~/components/StickyCollapsibleHeader/HeaderActions/useShareAction'

const mockSetCopied = vi.fn()
const mockOpenTwitterShareWindow = vi.fn()

vi.mock('@tamagui/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tamagui/core')>()
  return {
    ...actual,
    useTheme: () => ({
      neutral2: { val: '#000000', get: () => '#000000', variable: 'var(--neutral2)' },
    }),
  }
})

const mockUseSearchParams = vi.fn(() => [new URLSearchParams()])
vi.mock('react-router', () => ({
  useSearchParams: () => mockUseSearchParams(),
}))

vi.mock('utilities/src/react/useCopyClipboard', () => ({
  useCopyClipboard: vi.fn(() => [false, mockSetCopied]),
}))

vi.mock('~/utils/sharing', () => ({
  openTwitterShareWindow: (...args: unknown[]) => mockOpenTwitterShareWindow(...args),
}))

describe('useShareAction', () => {
  const defaultParams = {
    name: 'Token Name (TKN)',
    utmSource: 'share-tdp',
    isMobileScreen: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearchParams.mockReturnValue([new URLSearchParams()])
    Object.defineProperty(window, 'location', {
      value: { href: 'https://app.uniswap.org/tokens/0x123' },
      writable: true,
    })
  })

  it('returns shareAction', () => {
    const { result } = renderHook(() => useShareAction(defaultParams))

    expect(result.current).toHaveProperty('shareAction')
  })

  it('shareAction has expected shape with show true and two dropdown items', () => {
    const { result } = renderHook(() => useShareAction(defaultParams))

    const { shareAction } = result.current
    expect(shareAction.show).toBe(true)
    expect(shareAction.title).toBeDefined()
    expect(shareAction.dropdownItems).toHaveLength(2)
  })

  it('copy link dropdown item onPress calls setCopied with current location including UTM', () => {
    const { result } = renderHook(() => useShareAction(defaultParams))

    const copyItem = result.current.shareAction.dropdownItems[0]
    expect(copyItem).toBeDefined()
    expect(copyItem.onPress).toBeDefined()

    act(() => {
      copyItem.onPress!()
    })

    expect(mockSetCopied).toHaveBeenCalledTimes(1)
    expect(mockSetCopied).toHaveBeenCalledWith(
      'https://app.uniswap.org/tokens/0x123?utm_source=share-tdp&utm_medium=web',
    )
  })

  it('uses ? separator when window.location has no query string even if router search params are stale', () => {
    // Regression: TDP network pill does a shallow history.replaceState that clears the query string
    // while the router still holds stale search params (CONS-2648)
    const baseUrl = 'https://app.uniswap.org/explore/tokens/robinhood/0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168'
    Object.defineProperty(window, 'location', {
      value: { href: baseUrl },
      writable: true,
    })
    mockUseSearchParams.mockReturnValue([new URLSearchParams('chain=multichain')])

    const { result } = renderHook(() => useShareAction(defaultParams))

    act(() => {
      result.current.shareAction.dropdownItems[0].onPress!()
    })

    const copiedUrl = mockSetCopied.mock.calls[0][0] as string
    expect(copiedUrl).toBe(`${baseUrl}?utm_source=share-tdp&utm_medium=web`)
    expect(copiedUrl).not.toContain('&utm_source')
    expect(new URL(copiedUrl).pathname).toBe('/explore/tokens/robinhood/0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168')
  })

  it('preserves an existing query string with & separator', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://app.uniswap.org/tokens/0x123?chain=base' },
      writable: true,
    })

    const { result } = renderHook(() => useShareAction(defaultParams))

    act(() => {
      result.current.shareAction.dropdownItems[0].onPress!()
    })

    expect(mockSetCopied).toHaveBeenCalledWith(
      'https://app.uniswap.org/tokens/0x123?chain=base&utm_source=share-tdp&utm_medium=web',
    )
  })

  it('share to Twitter dropdown item onPress calls openTwitterShareWindow with name and url including UTM', () => {
    const baseUrl = 'https://x.com/uniswap'
    Object.defineProperty(window, 'location', {
      value: { href: baseUrl },
      writable: true,
    })

    const { result } = renderHook(() => useShareAction(defaultParams))

    const twitterItem = result.current.shareAction.dropdownItems[1]
    expect(twitterItem).toBeDefined()
    expect(twitterItem.onPress).toBeDefined()

    act(() => {
      twitterItem.onPress!()
    })

    expect(mockOpenTwitterShareWindow).toHaveBeenCalledTimes(1)
    expect(mockOpenTwitterShareWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Token Name (TKN)'),
        url: `${baseUrl}?utm_source=share-tdp&utm_medium=web`,
      }),
    )
  })
})
