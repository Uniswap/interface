import React from 'react'
// Note: test renderer must be required after react-native.
import renderer, { act } from 'react-test-renderer'
import { TraceUserProperties } from 'src/features/telemetry/TraceUserProperties'

import { useColorScheme } from 'react-native'
import * as biometricHooks from 'src/features/biometrics/hooks'
import * as telemetry from 'src/features/telemetry'
import { AuthMethod, UserPropertyName } from 'src/features/telemetry/constants'
import { AccountType, BackupType } from 'src/features/wallet/accounts/types'
import * as walletHooks from 'src/features/wallet/hooks'
import * as versionUtils from 'src/utils/version'

function mockFn(module: any, func: string, returnValue: any) {
  return jest.spyOn(module, func).mockImplementation(() => returnValue)
}

jest.mock('react-native/Libraries/Utilities/useColorScheme')

describe('TraceUserProperties', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('sets user properties with active account', () => {
    mockFn(versionUtils, 'getFullAppVersion', '1.0.0.345')
    // Hooks mocks
    const mockedUsedColorScheme = useColorScheme as jest.Mock
    mockedUsedColorScheme.mockReturnValue('dark')
    mockFn(walletHooks, 'useActiveAccount', {
      address: 'address',
      type: AccountType.SignerMnemonic,
      backups: [BackupType.Cloud],
      pushNotificationsEnabled: true,
    })
    mockFn(walletHooks, 'useViewOnlyAccounts', ['address1', 'address2'])
    mockFn(walletHooks, 'useSignerAccounts', ['address3'])
    mockFn(biometricHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: true,
      requiredForTransactions: true,
    })
    mockFn(biometricHooks, 'useDeviceSupportsBiometricAuth', {
      touchId: false,
      faceId: true,
    })

    // mock setUserProperty
    const mocked = mockFn(telemetry, 'setUserProperty', undefined)

    // Execute useEffects
    // https://reactjs.org/docs/test-renderer.html#testrendereract
    act(() => {
      renderer.create(<TraceUserProperties />)
    })

    // Check setUserProperty calls with correct values
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppVersion, '1.0.0.345')
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.DarkMode, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.ActiveWalletAddress, 'address')
    expect(mocked).toHaveBeenCalledWith(
      UserPropertyName.ActiveWalletType,
      AccountType.SignerMnemonic
    )
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.IsCloudBackedUp, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.IsPushEnabled, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletViewOnlyCount, 2)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletSignerCount, 1)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppOpenAuthMethod, AuthMethod.FaceId)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.TransactionAuthMethod, AuthMethod.FaceId)

    expect(mocked).toHaveBeenCalledTimes(10)
  })

  it('sets user properties without active account', () => {
    mockFn(versionUtils, 'getFullAppVersion', '1.0.0.345')
    // Hooks mocks
    const mockedUsedColorScheme = useColorScheme as jest.Mock
    mockedUsedColorScheme.mockReturnValue('dark')
    mockFn(walletHooks, 'useActiveAccount', null)
    mockFn(walletHooks, 'useViewOnlyAccounts', [])
    mockFn(walletHooks, 'useSignerAccounts', [])
    mockFn(biometricHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: false,
      requiredForTransactions: false,
    })
    mockFn(biometricHooks, 'useDeviceSupportsBiometricAuth', {
      touchId: false,
      faceId: false,
    })

    // mock setUserProperty
    const mocked = mockFn(telemetry, 'setUserProperty', undefined)

    // Execute useEffects
    act(() => {
      renderer.create(<TraceUserProperties />)
    })

    // Check setUserProperty calls with correct values
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppVersion, '1.0.0.345')
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.DarkMode, true)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletViewOnlyCount, 0)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.WalletSignerCount, 0)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.AppOpenAuthMethod, AuthMethod.None)
    expect(mocked).toHaveBeenCalledWith(UserPropertyName.TransactionAuthMethod, AuthMethod.None)

    expect(mocked).toHaveBeenCalledTimes(6)
  })
})
