import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'

function ProviderIcon({ provider, size }: { provider: 'google' | 'apple' | null; size: number }): JSX.Element {
  if (provider === 'google') {
    return <GoogleLogoGradient size={size} />
  }
  if (provider === 'apple') {
    return <AppleLogo size={size} color="$neutral1" />
  }
  return <Envelope size={size} color="$neutral1" />
}

function getProviderLabel(provider: 'google' | 'apple' | null, t: ReturnType<typeof useTranslation>['t']): string {
  if (provider === 'google') {
    return t('account.passkey.backupLogin.add.google')
  }
  if (provider === 'apple') {
    return t('account.passkey.backupLogin.add.apple')
  }
  return t('account.passkey.backupLogin.add.email')
}

const SIZE_CONFIG = {
  sm: {
    box: 32,
    icon: 16,
    radius: '$rounded8',
    gap: '$spacing2',
    variant: 'body3',
    color: '$neutral2',
  },
  lg: {
    box: 40,
    icon: 20,
    radius: '$rounded12',
    gap: '$gap4',
    variant: 'body2',
    color: '$neutral1',
  },
} as const

export function BackupMethodSummary({
  provider,
  email,
  size,
  iconOpacity,
}: {
  provider: 'google' | 'apple' | null
  email?: string
  size: 'sm' | 'lg'
  iconOpacity?: number
}): JSX.Element {
  const { t } = useTranslation()
  const config = SIZE_CONFIG[size]
  return (
    <Flex row gap="$gap12" alignItems="center">
      <Flex
        height={config.box}
        width={config.box}
        backgroundColor="$surface2"
        borderRadius={config.radius}
        alignItems="center"
        justifyContent="center"
        opacity={iconOpacity}
      >
        <ProviderIcon provider={provider} size={config.icon} />
      </Flex>
      <Flex flex={1} gap={config.gap}>
        <Text variant={config.variant} color={config.color}>
          {getProviderLabel(provider, t)}
        </Text>
        <Text variant="body3" color="$neutral2" numberOfLines={1}>
          {email}
        </Text>
      </Flex>
    </Flex>
  )
}
