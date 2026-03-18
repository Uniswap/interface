import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useShareAction } from '~/components/Explore/stickyHeader/HeaderActions/useShareAction'

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

vi.mock('react-router', () => ({
  useSearchParams: vi.fn(() => [new URLSearchParams()]),
}))

vi.mock('~/hooks/useCopyClipboard', () => ({
  default: vi.fn(() => [false, mockSetCopied]),
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
    expect(mockSetCopied).toHaveBeenCalledWith(expect.stringContaining('https://app.uniswap.org/tokens/0x123'))
    expect(mockSetCopied).toHaveBeenCalledWith(expect.stringContaining('utm_source=share-tdp'))
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
