import { authenticateAsync, hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics/biometrics-utils'
import type { MockedFunction } from 'vitest'

// expo-local-authentication is mocked with vi.fn()s in vitest-setup.ts

const mockedHasHardwareAsync = <MockedFunction<typeof hasHardwareAsync>>hasHardwareAsync
const mockedIsEnrolledAsync = <MockedFunction<typeof isEnrolledAsync>>isEnrolledAsync
const mockedAuthenticateAsync = <MockedFunction<typeof authenticateAsync>>authenticateAsync

describe(tryLocalAuthenticate, () => {
  it('checks hardware compatibility', async () => {
    mockedHasHardwareAsync.mockResolvedValue(false)

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.Unsupported)
  })

  it('checks enrollement', async () => {
    mockedHasHardwareAsync.mockResolvedValue(true)
    mockedIsEnrolledAsync.mockResolvedValue(false)
    mockedAuthenticateAsync.mockResolvedValue({ success: false, error: 'unknown' })

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.MissingEnrollment)
  })

  it('fails to authenticate when user rejects', async () => {
    mockedHasHardwareAsync.mockResolvedValue(true)
    mockedIsEnrolledAsync.mockResolvedValue(true)
    mockedAuthenticateAsync.mockResolvedValue({ success: false, error: 'unknown' })

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.Rejected)
  })

  it('authenticates when user accepts', async () => {
    mockedHasHardwareAsync.mockResolvedValue(true)
    mockedIsEnrolledAsync.mockResolvedValue(true)
    mockedAuthenticateAsync.mockResolvedValue({ success: true })

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.Authenticated)
  })

  it('always return authenticated when disabled', async () => {
    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.Authenticated)
  })
})
