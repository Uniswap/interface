import { AuthenticatorNameType } from '@universe/embedded-wallet'
import { AuthenticatorProvider, getProvider, getProviderLabel } from '~/components/Passkey/authenticatorProvider'

vi.mock('@universe/embedded-wallet/src/features/passkey/embeddedWallet', () => ({
  AuthenticatorNameType: {
    AUTHENTICATOR_NAME_TYPE_UNSPECIFIED: 0,
    GOOGLE_PASSWORD_MANAGER: 1,
    CHROME_MAC: 2,
    WINDOWS_HELLO: 3,
    ICLOUD_KEYCHAIN_MANAGED: 4,
    ICLOUD_KEYCHAIN: 15,
  },
}))

describe('getProvider', () => {
  it('maps Google Password Manager to the Google Password Manager provider, never Android', () => {
    const provider = getProvider(AuthenticatorNameType.GOOGLE_PASSWORD_MANAGER, AuthenticatorNameType)

    expect(provider).toBe(AuthenticatorProvider.GooglePasswordManager)
    expect(getProviderLabel(provider)).toBe('Google Password Manager')
    expect(getProviderLabel(provider)).not.toBe('Android')
  })

  it('maps each known providerName to its provider', () => {
    const cases: [AuthenticatorNameType, AuthenticatorProvider][] = [
      [AuthenticatorNameType.GOOGLE_PASSWORD_MANAGER, AuthenticatorProvider.GooglePasswordManager],
      [AuthenticatorNameType.CHROME_MAC, AuthenticatorProvider.Google],
      [AuthenticatorNameType.ICLOUD_KEYCHAIN, AuthenticatorProvider.Apple],
      [AuthenticatorNameType.ICLOUD_KEYCHAIN_MANAGED, AuthenticatorProvider.Apple],
      [AuthenticatorNameType.WINDOWS_HELLO, AuthenticatorProvider.Microsoft],
      [AuthenticatorNameType.AUTHENTICATOR_NAME_TYPE_UNSPECIFIED, AuthenticatorProvider.Other],
    ]

    for (const [providerName, expected] of cases) {
      expect(getProvider(providerName, AuthenticatorNameType)).toBe(expected)
    }
  })
})

describe('getProviderLabel', () => {
  it('returns the product name for named providers', () => {
    expect(getProviderLabel(AuthenticatorProvider.Apple)).toBe('iCloud')
    expect(getProviderLabel(AuthenticatorProvider.Google)).toBe('Chrome')
    expect(getProviderLabel(AuthenticatorProvider.Microsoft)).toBe('Windows')
    expect(getProviderLabel(AuthenticatorProvider.GooglePasswordManager)).toBe('Google Password Manager')
  })

  it('returns a numbered passkey label for other providers', () => {
    expect(getProviderLabel(AuthenticatorProvider.Other, 2)).toBe('Passkey 2')
  })
})
