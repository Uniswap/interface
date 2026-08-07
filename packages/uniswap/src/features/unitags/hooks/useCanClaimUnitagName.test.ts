import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { useCanClaimUnitagName } from 'uniswap/src/features/unitags/hooks/useCanClaimUnitagName'
import { renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string) => key,
  }),
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery', async (importOriginal) => {
  const originalModule =
    await importOriginal<typeof import('uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery')>()
  return {
    __esModule: true,
    ...originalModule,
    useUnitagsUsernameQuery: vi.fn(
      (): {
        isLoading: boolean
        data: { available: boolean; address?: string }
      } => ({
        isLoading: false,
        data: { available: true },
      }),
    ),
  }
})

vi.mock('uniswap/src/features/ens/useENS', () => ({
  useENS: vi.fn((): { loading: boolean } => ({
    loading: false,
  })),
}))

describe('useCanClaimUnitagName', (): void => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useUnitagsUsernameQuery as Mock).mockReturnValue({
      isLoading: false,
      data: { available: true },
    })
  })

  it('should return no error for a valid unitag', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'validunitag' }))

    expect(result.current.error).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })

  it('should return an error for a unitag that is too short', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'ab' }))

    expect(result.current.error).toBe('unitags.username.error.min')
  })

  it('should return an error for a unitag that is too long', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'a'.repeat(21) }))

    expect(result.current.error).toBe('unitags.username.error.max')
  })

  it('should return an error for a unitag with uppercase letters', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'Invalid' }))

    expect(result.current.error).toBe('unitags.username.error.uppercase')
  })

  it('should return an error for a unitag with invalid characters', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'invalid!' }))

    expect(result.current.error).toBe('unitags.username.error.chars')
  })

  it('should return an error if the unitag is unavailable', (): void => {
    const useUnitagsUsernameQueryMock = useUnitagsUsernameQuery as Mock

    useUnitagsUsernameQueryMock.mockReturnValue({
      isLoading: false,
      data: { available: false },
    })
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'unavailable' }))

    expect(result.current.error).toBe('unitags.claim.error.unavailable')
  })

  it('should return an error if the availability query fails', (): void => {
    const useUnitagsUsernameQueryMock = useUnitagsUsernameQuery as Mock

    useUnitagsUsernameQueryMock.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    })
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'validunitag' }))

    expect(result.current.error).toBe('unitags.claim.error.general')
  })

  it('should return no error if the unitag is taken but registered to the claimer address', (): void => {
    const useUnitagsUsernameQueryMock = useUnitagsUsernameQuery as Mock
    const claimer = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

    useUnitagsUsernameQueryMock.mockReturnValue({
      isLoading: false,
      data: { available: false, address: claimer.toLowerCase() },
    })
    const { result } = renderHook(() => useCanClaimUnitagName({ unitag: 'myunitag', claimerAddress: claimer }))

    expect(result.current.error).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })
})
