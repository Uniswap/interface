import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn } from 'components/AccountDrawer/shared'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { TFunction } from 'i18next'
import { useCallback, useEffect, useState } from 'react'
import { LifeBuoy } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Flex, Image, Text, useSporeColors } from 'ui/src'
import { CHROME_LOGO } from 'ui/src/assets'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { BE_AUTHENTICATOR_TYPE as Authenticator, listAuthenticators } from 'uniswap/src/features/passkey/embeddedWallet'

enum AuthenticatorProvider {
  Google = 'Chrome',
  Apple = 'iCloud',
  Other = 'Other',
}

type AuthenticatorDisplay = Authenticator & {
  provider: AuthenticatorProvider
  label: string
}

function getProviderIcon(provider: AuthenticatorProvider) {
  switch (provider) {
    case AuthenticatorProvider.Google:
      return <Image height={iconSizes.icon20} source={CHROME_LOGO} width={iconSizes.icon20} />
    case AuthenticatorProvider.Apple:
      return <AppleLogo height={iconSizes.icon20} width={iconSizes.icon20} />
    default:
      return <Passkey size={iconSizes.icon20} color="$neutral1" />
  }
}

function getProvider(providerName: string): AuthenticatorProvider {
  switch (providerName) {
    case 'Google Password Manager':
    case 'Chrome on Mac':
      return AuthenticatorProvider.Google
    case 'iCloud Keychain':
    case 'iCloud Keychain (Managed)':
      return AuthenticatorProvider.Apple
    default:
      return AuthenticatorProvider.Other
  }
}

function convertAuthenticatorsToDisplay(authenticators: Authenticator[], t: TFunction): AuthenticatorDisplay[] {
  let otherPasskeyCount = 1
  return authenticators.map((authenticator) => {
    const provider = getProvider(authenticator.providerName)
    const label =
      provider === AuthenticatorProvider.Other ? t('common.passkey.count', { number: otherPasskeyCount }) : provider
    provider === AuthenticatorProvider.Other && otherPasskeyCount++
    return {
      ...authenticator,
      provider,
      label,
    } as AuthenticatorDisplay
  })
}

const AuthenticatorRow = ({ authenticator }: { authenticator: AuthenticatorDisplay }) => {
  const { t } = useTranslation()
  // TODO[WEB-6962]: update when timestamp is added to Authenticator
  const createdAt = authenticator.username.split(' - ')[2]
  const createdAtDate = new Date(createdAt)
  const isValidDate = createdAtDate instanceof Date && !isNaN(createdAtDate.getTime())
  const formattedDate = createdAtDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: createdAtDate.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })

  return (
    <Flex row gap="$gap12" alignItems="center" pb="$padding16">
      <Flex
        height={40}
        width={40}
        background="$surface2"
        borderRadius="$rounded12"
        alignItems="center"
        justifyContent="center"
      >
        {getProviderIcon(authenticator.provider)}
      </Flex>
      <Flex>
        <Text variant="body2">{authenticator.label}</Text>
        {isValidDate && (
          <Text variant="body3" color="$neutral2">
            {t('common.created.date', { date: formattedDate })}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

export default function PasskeyMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [authenticators, setAuthenticators] = useState<AuthenticatorDisplay[]>([])

  const refreshAuthenticators = useCallback(async () => {
    const fetchAuthenticators = async () => {
      const authenticators = await listAuthenticators()
      const authenticatorsDisplay = convertAuthenticatorsToDisplay(authenticators, t)
      setAuthenticators(authenticatorsDisplay)
    }
    fetchAuthenticators()
  }, [t])

  useEffect(() => {
    refreshAuthenticators()
  }, [refreshAuthenticators])

  return (
    <SlideOutMenu
      title={t('common.passkeys')}
      onClose={onClose}
      rightIcon={
        <Anchor target="_blank" rel="noreferrer" href={uniswapUrls.helpUrl} {...ClickableTamaguiStyle}>
          <LifeBuoy size={20} color={colors.neutral2.val} />
        </Anchor>
      }
    >
      <MenuColumn gap="12px">
        {authenticators.map((authenticator) => (
          <AuthenticatorRow key={authenticator.id} authenticator={authenticator} />
        ))}
      </MenuColumn>
    </SlideOutMenu>
  )
}
