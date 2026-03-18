import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { Button, Flex, Text } from 'ui/src'
import { Language } from 'ui/src/components/icons'
import { colors, opacify } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isAndroid } from 'utilities/src/platform'
import { SettingsLanguageModalProps } from 'wallet/src/components/settings/language/SettingsLanguageModalProps'

const openLanguageSettings = async (): Promise<void> => {
  if (isAndroid) {
    await Linking.openSettings()
  } else {
    await Linking.openURL('app-settings:')
  }
}

export function SettingsLanguageModal({ onClose }: Omit<SettingsLanguageModalProps, 'isOpen'>): JSX.Element {
  const { t } = useTranslation()

  return (
    <Modal name={ModalName.LanguageSelector} onClose={onClose}>
      <Flex centered mt="$spacing16">
        <Flex backgroundColor={opacify(12, colors.blueBase)} borderRadius="$rounded12" p="$spacing12">
          <Language color="$blueBase" size="$icon.24" strokeWidth={1.5} />
        </Flex>
      </Flex>
      <Flex gap="$spacing24" pt="$spacing24" px="$spacing24">
        <Flex gap="$spacing8">
          <Text textAlign="center" variant="subheading1">
            {t('settings.setting.language.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('settings.setting.language.description.mobile')}
          </Text>
        </Flex>
        <Flex row>
          <Button testID={TestID.OpenDeviceLanguageSettings} emphasis="secondary" onPress={openLanguageSettings}>
            {t('settings.setting.language.button.navigate')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
