import { FunctionComponent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Circle, Flex, IconProps, Text } from 'ui/src'
import { EyeOff, Key, PencilDetailed } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

export function BackupWarningBulletPoints(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      alignItems="flex-start"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      gap="$spacing24"
      p="$spacing24"
    >
      <Flex row alignItems="center" gap="$spacing16">
        <WarningIcon Icon={Key} />
        <Text variant="body2">{t('onboarding.backup.view.warning.message1')}</Text>
      </Flex>
      <Flex row alignItems="center" gap="$spacing16">
        <WarningIcon Icon={PencilDetailed} />
        <Text variant="body2">{t('onboarding.backup.view.warning.message2')}</Text>
      </Flex>
      <Flex row alignItems="center" gap="$spacing16">
        <WarningIcon Icon={EyeOff} />
        <Text textAlign="left" variant="body2">
          <Trans
            components={{ u: <Text textDecorationLine="underline" variant="body2" /> }}
            i18nKey="onboarding.backup.view.warning.message3"
          />
        </Text>
      </Flex>
    </Flex>
  )
}

function WarningIcon({ Icon }: { Icon: FunctionComponent<IconProps> }): JSX.Element {
  return (
    <Circle backgroundColor="$statusCritical2" size={iconSizes.icon36}>
      <Icon color="$statusCritical" size="$icon.24" />
    </Circle>
  )
}
