import { AuthenticatorNameType } from '@universe/embedded-wallet'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { IcloudPasswordLogo } from 'ui/src/components/icons/IcloudPasswordLogo'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Windows } from 'ui/src/components/icons/Windows'
import i18n from 'uniswap/src/i18n'
import { AuthenticatorProvider } from '~/types/authenticatorProvider'

export { AuthenticatorProvider }

export function getProviderIcon(provider: AuthenticatorProvider): JSX.Element {
  switch (provider) {
    case AuthenticatorProvider.Google:
    case AuthenticatorProvider.GooglePasswordManager:
      return <GoogleLogoGradient size="$icon.20" />
    case AuthenticatorProvider.Apple:
      return <IcloudPasswordLogo size="$icon.20" />
    case AuthenticatorProvider.Microsoft:
      return <Windows size="$icon.20" color="$neutral1" />
    default:
      return <Passkey size="$icon.20" color="$neutral1" />
  }
}

export function getProviderLabel(provider: AuthenticatorProvider, count?: number): string {
  switch (provider) {
    case AuthenticatorProvider.GooglePasswordManager:
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
      return AuthenticatorProvider.GooglePasswordManager
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
