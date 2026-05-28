import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Eye } from 'ui/src/components/icons/Eye'
import { Laptop } from 'ui/src/components/icons/Laptop'
import { Lock } from 'ui/src/components/icons/Lock'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

function WarningBullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Flex row gap="$gap8" alignItems="center">
      <Flex width={32} height={32} alignItems="center" justifyContent="center">
        {icon}
      </Flex>
      <Text variant="body3" color="$neutral1" flex={1}>
        {text}
      </Text>
    </Flex>
  )
}

export function WarningContent({ onContinue, isLoading }: { onContinue: () => void; isLoading: boolean }) {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap24" px="$padding8">
      <Flex gap="$gap16">
        <Flex
          width={48}
          height={48}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$statusCritical2"
          borderRadius="$rounded12"
        >
          <AlertTriangleFilled size="$icon.24" color="$statusCritical" />
        </Flex>
        <Flex gap="$gap8" pr="$spacing24">
          <Text variant="subheading1" color="$neutral1">
            {t('setting.recoveryPhrase.view.warning.title')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {t('setting.recoveryPhrase.export.subtitle')}
          </Text>
          <Text variant="body3" color="$statusCritical">
            {t('setting.recoveryPhrase.export.warning')}
          </Text>
        </Flex>
      </Flex>

      <Flex borderColor="$surface3" borderWidth={1} borderRadius="$rounded16" p="$spacing12" gap="$gap8">
        <WarningBullet
          icon={<Eye size="$icon.24" color="$statusCritical" />}
          text={t('setting.recoveryPhrase.view.warning.message2')}
        />
        <WarningBullet
          icon={<Lock size="$icon.24" color="$statusCritical" />}
          text={t('setting.recoveryPhrase.view.warning.message3')}
        />
        <WarningBullet
          icon={<Laptop size="$icon.24" color="$statusCritical" />}
          text={t('setting.recoveryPhrase.export.trustedDevice')}
        />
      </Flex>
      <Flex row justifyContent="center" alignSelf="stretch">
        <Trace logPress element={ElementName.ViewRecoveryPhrase}>
          <Button
            size="medium"
            emphasis="primary"
            icon={<Passkey size="$icon.24" />}
            onPress={onContinue}
            loading={isLoading}
          >
            {t('setting.recoveryPhrase.export.viewButton')}
          </Button>
        </Trace>
      </Flex>
    </Flex>
  )
}
