import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Language } from 'ui/src/components/icons'
import { DEP_accentColors, opacify } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

import { SettingsLanguageModalProps } from 'wallet/src/components/settings/language/SettingsLanguageModalProps'

export function SettingsLanguageModal({ isOpen, onClose }: SettingsLanguageModalProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Modal isModalOpen={isOpen} name={ModalName.LanguageSelector} onClose={onClose}>
      <Flex p="$spacing4" pt="$spacing8">
        <Flex centered>
          <Flex backgroundColor={opacify(10, DEP_accentColors.blue300)} borderRadius="$rounded12" p="$spacing12">
            <Language color={DEP_accentColors.blue300} size="$icon.24" strokeWidth={1.5} />
          </Flex>
        </Flex>
        <Flex gap="$spacing24" pt="$spacing24">
          <Flex gap="$spacing8">
            <Text textAlign="center" variant="subheading1">
              {t('settings.setting.language.title')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('settings.setting.language.description.extension')}
            </Text>
          </Flex>
          <Flex row>
            <Button emphasis="secondary" onPress={() => onClose()}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  )
}
