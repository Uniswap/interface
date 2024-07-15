import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { Language } from 'ui/src/components/icons'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { opacify } from 'uniswap/src/utils/colors'
import { SettingsLanguageModalProps } from 'wallet/src/components/settings/language/SettingsLanguageModalProps'

export function SettingsLanguageModal({ onClose }: SettingsLanguageModalProps): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <BottomSheetModal name={ModalName.LanguageSelector} onClose={onClose}>
      <Flex p="$spacing4" pt="$spacing8">
        <Flex centered>
          <Flex
            borderRadius="$rounded12"
            p="$spacing12"
            style={{ backgroundColor: opacify(10, colors.DEP_blue300.val) }}
          >
            <Language color="$DEP_blue300" size="$icon.24" strokeWidth={1.5} />
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
          <Button theme="tertiary" onPress={() => onClose()}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}
