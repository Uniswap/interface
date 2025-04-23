import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { useCanClaimUnitagName } from 'uniswap/src/features/unitags/hooks/useCanClaimUnitagName'
import { renderHook } from 'uniswap/src/test/test-utils'

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string) => key,
  }),
}))

jest.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery', () => {
  const originalModule = jest.requireActual('uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery')
  return {
    __esModule: true,
    ...originalModule,
    useUnitagsUsernameQuery: jest.fn((): { isLoading: boolean; data: { available: boolean } } => ({
      isLoading: false,
      data: { available: true },
    })),
  }
})

jest.mock('uniswap/src/features/ens/useENS', () => ({
  useENS: jest.fn((): { loading: boolean } => ({
    loading: false,
  })),
}))

describe('useCanClaimUnitagName', (): void => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return no error for a valid unitag', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName('validunitag'))

    expect(result.current.error).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })

  it('should return an error for a unitag that is too short', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName('ab'))

    expect(result.current.error).toBe('unitags.username.error.min')
  })

  it('should return an error for a unitag that is too long', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName('a'.repeat(21)))

    expect(result.current.error).toBe('unitags.username.error.max')
  })

  it('should return an error for a unitag with uppercase letters', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName('Invalid'))

    expect(result.current.error).toBe('unitags.username.error.uppercase')
  })

  it('should return an error for a unitag with invalid characters', (): void => {
    const { result } = renderHook(() => useCanClaimUnitagName('invalid!'))

    expect(result.current.error).toBe('unitags.username.error.chars')
  })

  it('should return an error if the unitag is unavailable', (): void => {
    const useUnitagsUsernameQueryMock = useUnitagsUsernameQuery as jest.Mock

    useUnitagsUsernameQueryMock.mockReturnValueOnce({
      isLoading: false,
      data: { available: false },
    })
    const { result } = renderHook(() => useCanClaimUnitagName('unavailable'))

    expect(result.current.error).toBe('unitags.claim.error.unavailable')
  })
})
