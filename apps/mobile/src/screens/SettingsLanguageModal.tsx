import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { Action } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { closeModal } from 'src/features/modals/modalSlice'
import { Button, Flex, Icons, Text } from 'ui/src'
import { isAndroid } from 'uniswap/src/utils/platform'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

// TODO(MOB-1190): this is DEP_blue_300 at 10% opacity, remove when we have a named color for this
const LIGHT_BLUE = '#4C82FB1A'

const openLanguageSettings = async (): Promise<void> => {
  if (isAndroid) {
    await Linking.openSettings()
  } else {
    await Linking.openURL('app-settings:')
  }
}

export function SettingsLanguageModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const onClose = useCallback(
    (): Action => dispatch(closeModal({ name: ModalName.LanguageSelector })),
    [dispatch]
  )

  return (
    <BottomSheetModal name={ModalName.LanguageSelector} onClose={onClose}>
      <Flex centered mt="$spacing16">
        <Flex borderRadius="$rounded12" p="$spacing12" style={{ backgroundColor: LIGHT_BLUE }}>
          <Icons.Language color="$DEP_blue300" size="$icon.24" strokeWidth={1.5} />
        </Flex>
      </Flex>
      <Flex gap="$spacing24" pt="$spacing24" px="$spacing24">
        <Flex gap="$spacing8">
          <Text textAlign="center" variant="subheading1">
            {t('settings.setting.language.title')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('settings.setting.language.description')}
          </Text>
        </Flex>
        <Button
          testID={ElementName.OpenDeviceLanguageSettings}
          theme="tertiary"
          onPress={openLanguageSettings}>
          {t('settings.setting.language.button.navigate')}
        </Button>
      </Flex>
    </BottomSheetModal>
  )
}
