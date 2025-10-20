import React from 'react'
import { useColorScheme } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import { TraceUserProperties } from 'src/components/Trace/TraceUserProperties'
import * as biometricAppSettingsHooks from 'src/features/biometrics/useBiometricAppSettings'
import * as deviceBiometricHooks from 'src/features/biometrics/useDeviceSupportsBiometricAuth'
import { AuthMethod } from 'src/features/telemetry/utils'
import * as versionUtils from 'src/utils/version'
import * as useIsDarkModeFile from 'ui/src/hooks/useIsDarkMode'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import * as fiatCurrencyHooks from 'uniswap/src/features/fiatCurrency/hooks'
import * as languageHooks from 'uniswap/src/features/language/hooks'
import * as userSettingsHooks from 'uniswap/src/features/settings/hooks'
import { MobileUserPropertyName } from 'uniswap/src/features/telemetry/user'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import * as walletHooks from 'wallet/src/features/wallet/hooks'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

// `any` is the actual type used by `jest.spyOn`
// eslint-disable-next-line max-params
function mockFn(module: any, func: string, returnValue: any): jest.SpyInstance<any, unknown[]> {
  return jest.spyOn(module, func).mockImplementation(() => returnValue)
}

jest.mock('react-native/Libraries/Utilities/useColorScheme')
jest.mock('wallet/src/features/gating/userPropertyHooks')
jest.mock('wallet/src/features/wallet/Keyring/Keyring', () => {
  return {
    Keyring: {
      getMnemonicIds: (): Promise<string[]> => Promise.resolve([]),
      getAddressesForStoredPrivateKeys: (): Promise<string[]> => Promise.resolve([]),
    },
  }
})
jest.mock('wallet/src/features/accounts/useAccountListData', () => {
  return {
    useAccountBalances: jest.fn().mockReturnValue({ totalBalance: 0 }),
  }
})

const mockDispatch = jest.fn()
const mockSelector = jest.fn()

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: (): jest.Mock => mockDispatch,
  useSelector: (): jest.Mock => mockSelector,
}))

const address1 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BF'
const address2 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BD'
const address3 = '0x168fA52Da8A45cEb01318E72B299b2d6A17167BE'

const signerAccount1 = {
  type: AccountType.SignerMnemonic,
  address: address1,
  timeImportedMs: 100000,
  pushNotificationsEnabled: true,
  mnemonicId: '111',
  derivationIndex: 0,
} satisfies SignerMnemonicAccount

const signerAccount2 = {
  type: AccountType.SignerMnemonic,
  address: address2,
  timeImportedMs: 100000,
  pushNotificationsEnabled: true,
  mnemonicId: '222',
  derivationIndex: 1,
} satisfies SignerMnemonicAccount

const signerAccount3 = {
  type: AccountType.SignerMnemonic,
  address: address3,
  timeImportedMs: 100000,
  pushNotificationsEnabled: true,
  mnemonicId: '333',
  derivationIndex: 2,
} satisfies SignerMnemonicAccount

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
    mockFn(userSettingsHooks, 'useHideSpamTokensSetting', true)
    mockFn(userSettingsHooks, 'useHideSmallBalancesSetting', false)
    mockFn(biometricAppSettingsHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: true,
      requiredForTransactions: true,
    })
    mockFn(deviceBiometricHooks, 'useDeviceSupportsBiometricAuth', {
      touchId: false,
      faceId: true,
    })
    mockFn(useIsDarkModeFile, 'useIsDarkMode', true)
    mockFn(fiatCurrencyHooks, 'useAppFiatCurrency', FiatCurrency.UnitedStatesDollar)
    mockFn(languageHooks, 'useCurrentLanguageInfo', { loggingName: 'English' })

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
    expect(mocked).toHaveBeenCalledWith(MobileUserPropertyName.BackupTypes, [BackupType.Cloud], undefined)
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

    expect(mocked).toHaveBeenCalledTimes(22)
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
    mockFn(biometricAppSettingsHooks, 'useBiometricAppSettings', {
      requiredForAppAccess: false,
      requiredForTransactions: false,
    })
    mockFn(deviceBiometricHooks, 'useDeviceSupportsBiometricAuth', {
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

    expect(mocked).toHaveBeenCalledTimes(15)
  })
})
