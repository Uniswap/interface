import { renderHook } from '@testing-library/react-native'
import { useEarnBiometricsIcon } from 'src/components/earn/hooks/useEarnBiometricsIcon'

const mocks = vi.hoisted(() => ({
  biometricIcon: { type: 'biometric-icon' } as JSX.Element,
  isBiometricAuthEnabled: true,
  renderBiometricsIcon: vi.fn(),
  requiredForTransactions: true,
}))

vi.mock('src/components/icons/useBiometricsIcon', () => ({
  useBiometricsIcon: () => mocks.renderBiometricsIcon,
}))

vi.mock('src/features/biometrics/useBiometricAppSettings', () => ({
  useBiometricAppSettings: () => ({ requiredForTransactions: mocks.requiredForTransactions }),
}))

vi.mock('src/features/biometrics/useOsBiometricAuthEnabled', () => ({
  useOsBiometricAuthEnabled: () => mocks.isBiometricAuthEnabled,
}))

describe(useEarnBiometricsIcon, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isBiometricAuthEnabled = true
    mocks.renderBiometricsIcon.mockReturnValue(mocks.biometricIcon)
    mocks.requiredForTransactions = true
  })

  it('returns the available biometric glyph when transaction authentication is enabled', () => {
    const { result } = renderHook(() => useEarnBiometricsIcon())

    expect(result.current).toBe(mocks.biometricIcon)
    expect(mocks.renderBiometricsIcon).toHaveBeenCalledWith({})
  })

  it('omits the glyph when transaction authentication is disabled', () => {
    mocks.requiredForTransactions = false

    const { result } = renderHook(() => useEarnBiometricsIcon())

    expect(result.current).toBeUndefined()
    expect(mocks.renderBiometricsIcon).not.toHaveBeenCalled()
  })

  it('omits the glyph when OS biometric authentication is unavailable', () => {
    mocks.isBiometricAuthEnabled = false

    const { result } = renderHook(() => useEarnBiometricsIcon())

    expect(result.current).toBeUndefined()
    expect(mocks.renderBiometricsIcon).not.toHaveBeenCalled()
  })
})
