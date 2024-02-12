import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { Action } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Button, Flex, Icons, Text } from 'ui/src'
import { isAndroid } from 'wallet/src/utils/platform'

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
            {t('Change preferred language')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t(
              'Uniswap defaults to your device‘s language settings. To change your preferred language, go to “Uniswap” in your device settings and tap on “Language”'
            )}
          </Text>
        </Flex>
        <Button
          testID={ElementName.OpenDeviceLanguageSettings}
          theme="tertiary"
          onPress={openLanguageSettings}>
          {t('Go to settings')}
        </Button>
      </Flex>
    </BottomSheetModal>
  )
}
