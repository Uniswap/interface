import React from 'react'
import { useColorScheme } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import * as appHooks from 'src/app/hooks'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import * as biometricHooks from 'src/features/biometrics/hooks'
import { AuthMethod } from 'src/features/telemetry/utils'
import * as versionUtils from 'src/utils/version'
import * as useIsDarkModeFile from 'ui/src/hooks/useIsDarkMode'
import { MobileUserPropertyName } from 'uniswap/src/features/telemetry/user'
// eslint-disable-next-line no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import * as fiatCurrencyHooks from 'wallet/src/features/fiatCurrency/hooks'
import * as languageHooks from 'wallet/src/features/language/hooks'
import { AccountType, BackupType } from 'wallet/src/features/wallet/accounts/types'
import * as walletHooks from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

// `any` is the actual type used by `jest.spyOn`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockFn(module: any, func: string, returnValue: any): jest.SpyInstance<any, unknown[]> {
  return jest.spyOn(module, func).mockImplementation(() => returnValue)
}

jest.mock('react-native/Libraries/Utilities/useColorScheme')
jest.mock('wallet/src/features/gating/userPropertyHooks')
jest.mock('wallet/src/features/wallet/Keyring/Keyring', () => {
  return {
    Keyring: {
      getMnemonicIds: (): Promise<string[]> => Promise.resolve([]),
    },
  }
})

const address1 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BF'
const address2 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BD'
const address3 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BE'

const signerAccount1 = {
  type: AccountType.SignerMnemonic,
  address: address1,
  timeImportedMs: 100000,
}

const signerAccount2 = {
  type: AccountType.SignerMnemonic,
  address: address2,
  timeImportedMs: 100000,
}

const signerAccount3 = {
  type: AccountType.SignerMnemonic,
  address: address3,
  timeImportedMs: 100000,
}

describe('TraceUserProperties', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('sets user properties with active account', async () => {
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
    mockFn(walletHooks, 'useSwapProtectionSetting', SwapProtectionSetting.On)
    mockFn(walletHooks, 'useSignerAccounts', [signerAccount1, signerAccount2, signerAccount3])
    mockFn(walletHooks, 'useHideSpamTokensSetting', true)
    mockFn(walletHooks, 'useHideSmallBalancesSetting', false)
    mockFn(biometricHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: true,
      requiredForTransactions: true,
    })
    mockFn(biometricHooks, 'useDeviceSupportsBiometricAuth', {
      touchId: false,
      faceId: true,
    })
    mockFn(useIsDarkModeFile, 'useIsDarkMode', true)
    mockFn(fiatCurrencyHooks, 'useAppFiatCurrency', FiatCurrency.UnitedStatesDollar)
    mockFn(languageHooks, 'useCurrentLanguageInfo', { loggingName: 'English' })
    mockFn(appHooks, 'useAppSelector', { enabled: true })

    // mock setUserProperty
    const mocked = mockFn(analytics, 'setUserProperty', undefined)

    // Execute useEffects
    // https://reactjs.org/docs/test-renderer.html#testrendereract
    await act(() => {
      renderer.create(<TraceUserProperties />)
    })

    // Check setUserProperty calls with correct values
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.AppVersion, '1.0.0.345', undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.DarkMode, true, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.ActiveWalletAddress, 'address', undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.ActiveWalletType, AccountType.SignerMnemonic, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.IsCloudBackedUp, true, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.IsPushEnabled, true, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.IsHideSmallBalancesEnabled, false, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.IsHideSpamTokensEnabled, true, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.WalletViewOnlyCount, 2, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.WalletSignerCount, 3, undefined)
    expect(mocked).toHaveBeenCalledWith(
      MobileUserPropertyName.WalletSignerAccounts,
      [address1, address2, address3],
      undefined,
    )
    expect(mocked).toHaveBeenCalledWith(
      MobileUserPropertyName.WalletSwapProtectionSetting,
      SwapProtectionSetting.On,
      undefined,
    )
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.AppOpenAuthMethod, AuthMethod.FaceId, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.TransactionAuthMethod, AuthMethod.FaceId, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.Language, 'English', undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.Currency, 'USD', undefined)

    expect(mocked).toHaveBeenCalledTimes(17)
  })

  it('sets user properties without active account', async () => {
    mockFn(versionUtils, 'getFullAppVersion', '1.0.0.345')
    // Hooks mocks
    const mockedUsedColorScheme = useColorScheme as jest.Mock
    mockedUsedColorScheme.mockReturnValue('dark')
    mockFn(walletHooks, 'useActiveAccount', null)
    mockFn(walletHooks, 'useViewOnlyAccounts', [])
    mockFn(walletHooks, 'useSwapProtectionSetting', SwapProtectionSetting.On)
    mockFn(walletHooks, 'useSignerAccounts', [])
    mockFn(biometricHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: false,
      requiredForTransactions: false,
    })
    mockFn(biometricHooks, 'useDeviceSupportsBiometricAuth', {
      touchId: false,
      faceId: false,
    })
    mockFn(useIsDarkModeFile, 'useIsDarkMode', true)
    mockFn(fiatCurrencyHooks, 'useAppFiatCurrency', FiatCurrency.UnitedStatesDollar)
    mockFn(languageHooks, 'useCurrentLanguageInfo', { loggingName: 'English' })

    // mock setUserProperty
    const mocked = mockFn(analytics, 'setUserProperty', undefined)

    // Execute useEffects
    await act(() => {
      renderer.create(<TraceUserProperties />)
    })

    // Check setUserProperty calls with correct values
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.AppVersion, '1.0.0.345', undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.DarkMode, true, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.WalletViewOnlyCount, 0, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.WalletSignerCount, 0, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.AppOpenAuthMethod, AuthMethod.None, undefined)
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.TransactionAuthMethod, AuthMethod.None, undefined)

    expect(mocked).toHaveBeenCalledTimes(11)
  })
})
