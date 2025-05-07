import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LockPreviewImage } from 'src/features/onboarding/LockPreviewImage'
import { Button, Flex, LabeledCheckbox, Text, useIsDarkMode, useShadowPropsShort } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

const PREVIEW_BOX_HEIGHT = 122

type BackupSpeedBumpModalProps = {
  backupType: BackupType.Cloud | BackupType.Manual

  onContinue: () => void
  onClose: () => void
}
export function BackupSpeedBumpModal({ backupType, onContinue, onClose }: BackupSpeedBumpModalProps): JSX.Element {
  const { t } = useTranslation()
  const [checked, setChecked] = useState(false)

  // eslint-disable-next-line consistent-return
  const { preview, title, description, disclaimer } = useMemo(() => {
    switch (backupType) {
      case BackupType.Cloud:
        return {
          preview: <CloudBackupPreview />,
          title: t('onboarding.backup.speedBump.cloud.title'),
          description: t('onboarding.backup.speedBump.cloud.description'),
          disclaimer: t('onboarding.backup.speedBump.cloud.disclaimer'),
        }
      case BackupType.Manual:
        return {
          preview: <LockPreviewImage height={PREVIEW_BOX_HEIGHT} />,
          title: t('onboarding.backup.speedBump.manual.title'),
          description: t('onboarding.backup.speedBump.manual.description'),
          disclaimer: t('onboarding.backup.speedBump.manual.disclaimer'),
        }
    }
  }, [backupType, t])

  return (
    <Modal name={ModalName.AccountEdit} onClose={onClose}>
      <Flex gap="$spacing12" px="$spacing24" py="$spacing12">
        {preview}
        <Flex gap="$spacing4">
          <Text color="$neutral1" pt="$spacing4" textAlign="center" variant="subheading1">
            {title}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {description}
          </Text>
        </Flex>

        <Flex
          row
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          gap="$spacing4"
          px="$spacing12"
          py="$spacing16"
          onPress={() => setChecked(!checked)}
        >
          <LabeledCheckbox
            checked={checked}
            checkedColor="$accent1"
            onCheckPressed={() => {
              setChecked(!checked)
            }}
          />
          <Text color="$neutral2" flexShrink={1} variant="body3">
            {disclaimer}
          </Text>
        </Flex>

        <Flex row gap="$spacing8">
          <Button size="large" emphasis="secondary" onPress={() => onClose()}>
            {t('common.button.back')}
          </Button>
          <Button isDisabled={!checked} size="large" variant="branded" onPress={() => onContinue()}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}

const BULLET_COUNT = 13
const BULLET = '•'

function CloudBackupPreview(): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const shadowProps = useShadowPropsShort()
  const bullets = new Array(BULLET_COUNT).fill(BULLET)

  return (
    <Flex centered backgroundColor="$surface2" borderRadius="$rounded16" height={PREVIEW_BOX_HEIGHT}>
      <Flex
        centered
        row
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        gap="$spacing16"
        px="$spacing12"
        py="$spacing8"
        {...shadowProps}
      >
        <Text color={isDarkMode ? '$neutral1' : '$neutral2'} variant="heading3">
          {bullets}
        </Text>
        <CheckCircleFilled color="$statusSuccess" size="$icon.20" />
      </Flex>
    </Flex>
  )
}
