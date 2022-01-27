import { authenticateAsync, hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication'
import { BiometricAuthenticationStatus, tryLocalAuthenticate } from 'src/features/biometrics'
import { isEnabled } from 'src/features/remoteConfig'

jest.mock('expo-local-authentication')
jest.mock('src/features/remoteConfig')

const mockedHasHardwareAsync = <jest.MockedFunction<typeof hasHardwareAsync>>hasHardwareAsync
const mockedIsEnrolledAsync = <jest.MockedFunction<typeof isEnrolledAsync>>isEnrolledAsync
const mockedAuthenticateAsync = <jest.MockedFunction<typeof authenticateAsync>>authenticateAsync

const mockedIsEnabled = <jest.MockedFunction<typeof isEnabled>>isEnabled

describe(tryLocalAuthenticate, () => {
  beforeEach(() => {
    mockedIsEnabled.mockReturnValue(true)
  })

  it('checks hardware compatibility', async () => {
    mockedHasHardwareAsync.mockResolvedValue(false)

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.UNSUPPORTED)
  })

  it('checks enrollement', async () => {
    mockedHasHardwareAsync.mockResolvedValue(true)
    mockedIsEnrolledAsync.mockResolvedValue(false)

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.MISSING_ENROLLMENT)
  })

  it('fails to authenticate when user rejects', async () => {
    mockedHasHardwareAsync.mockResolvedValue(true)
    mockedIsEnrolledAsync.mockResolvedValue(true)
    mockedAuthenticateAsync.mockResolvedValue({ success: false, error: '' })

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.REJECTED)
  })

  it('authenticates when user accepts', async () => {
    mockedHasHardwareAsync.mockResolvedValue(true)
    mockedIsEnrolledAsync.mockResolvedValue(true)
    mockedAuthenticateAsync.mockResolvedValue({ success: true })

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.AUTHENTICATED)
  })

  it('always return authenticated when disabled', async () => {
    mockedIsEnabled.mockReturnValue(false)

    const status = await tryLocalAuthenticate()

    expect(status).toEqual(BiometricAuthenticationStatus.AUTHENTICATED)
  })
})
