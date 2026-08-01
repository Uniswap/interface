import { AndroidLogo } from 'ui/src/components/icons/AndroidLogo'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { IcloudPasswordLogo } from 'ui/src/components/icons/IcloudPasswordLogo'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Windows } from 'ui/src/components/icons/Windows'
import { AuthenticatorNameType } from 'uniswap/src/features/passkey/embeddedWallet'
import i18n from 'uniswap/src/i18n'
import { AuthenticatorProvider } from '~/types/authenticatorProvider'

export { AuthenticatorProvider }

export function getProviderIcon(provider: AuthenticatorProvider): JSX.Element {
  switch (provider) {
    case AuthenticatorProvider.Google:
      return <GoogleLogoGradient size="$icon.20" />
    case AuthenticatorProvider.Apple:
      return <IcloudPasswordLogo size="$icon.20" />
    case AuthenticatorProvider.Android:
      return <AndroidLogo size="$icon.20" color="$neutral1" />
    case AuthenticatorProvider.Microsoft:
      return <Windows size="$icon.20" color="$neutral1" />
    default:
      return <Passkey size="$icon.20" color="$neutral1" />
  }
}

export function getProviderLabel(provider: AuthenticatorProvider, count?: number): string {
  switch (provider) {
    case AuthenticatorProvider.Android:
    case AuthenticatorProvider.Microsoft:
    case AuthenticatorProvider.Apple:
    case AuthenticatorProvider.Google: {
      return provider
    }
    default: {
      return i18n.t('common.passkey.count', { number: count ?? 0 })
    }
  }
}

export function getProvider(
  providerName: AuthenticatorNameType,
  nameType: typeof AuthenticatorNameType,
): AuthenticatorProvider {
  switch (providerName) {
    case nameType.GOOGLE_PASSWORD_MANAGER:
      return AuthenticatorProvider.Android
    case nameType.CHROME_MAC:
      return AuthenticatorProvider.Google
    case nameType.ICLOUD_KEYCHAIN:
    case nameType.ICLOUD_KEYCHAIN_MANAGED:
      return AuthenticatorProvider.Apple
    case nameType.WINDOWS_HELLO:
      return AuthenticatorProvider.Microsoft
    default:
      return AuthenticatorProvider.Other
  }
}
