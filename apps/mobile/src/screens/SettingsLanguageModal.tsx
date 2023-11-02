import React from 'react'
import { useTranslation } from 'react-i18next'
import { Action } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Flex, ScrollView, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Check } from 'ui/src/components/icons'
import { logger } from 'utilities/src/logger/logger'
import { Language, ORDERED_LANGUAGES } from 'wallet/src/features/language/constants'
import {
  LanguageInfo,
  useCurrentLanguage,
  useLanguageInfo,
} from 'wallet/src/features/language/hooks'
import { setCurrentLanguage } from 'wallet/src/features/language/slice'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export function SettingsLanguageModal(): JSX.Element {
  const dispatch = useAppDispatch()

  return (
    <BottomSheetModal
      disableSwipe
      fullScreen
      name={ModalName.LanguageSelector}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.LanguageSelector }))}>
      <ScrollView>
        <LanguageSelection
          onClose={(): void => {
            dispatch(closeModal({ name: ModalName.LanguageSelector }))
          }}
        />
      </ScrollView>
    </BottomSheetModal>
  )
}

function LanguageSelection({ onClose }: { onClose: () => void }): JSX.Element {
  const { i18n, t } = useTranslation()
  const dispatch = useAppDispatch()
  const accounts = useAccounts()
  const addresses = Object.keys(accounts)
  const selectedLanguge = useCurrentLanguage()

  const changeLanguage = (language: Language): ((languageInfo: LanguageInfo) => void) => {
    return (languageInfo: LanguageInfo): void => {
      const { locale } = languageInfo
      i18n
        .changeLanguage(locale)
        .then(() => {
          dispatch(setCurrentLanguage(language))
          addresses.forEach((address): void => {
            dispatch(
              editAccountActions.trigger({
                type: EditAccountAction.UpdateLanguage,
                address,
                locale,
              })
            )
          })
          onClose()
        })
        .catch(() => {
          logger.warn('SettingsLanguageModal', 'LanguageOption', 'Failed to change language')
        })
    }
  }

  return (
    <Flex pb="$spacing32" px="$spacing16">
      <Text pb="$spacing12" textAlign="center" variant="subheading1">
        {t('Language')}
      </Text>
      {ORDERED_LANGUAGES.map((language) => (
        <LanguageOption
          active={selectedLanguge === language}
          language={language}
          onPress={changeLanguage(language)}
        />
      ))}
    </Flex>
  )
}

interface LanguageOptionProps {
  active?: boolean
  language: Language
  onPress: (languageInfo: LanguageInfo) => void
}

function LanguageOption({ active, language, onPress }: LanguageOptionProps): JSX.Element {
  const colors = useSporeColors()
  const languageInfo = useLanguageInfo(language)
  const { name, originName } = languageInfo

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      px="$spacing12"
      py="$spacing12"
      onPress={(): void => onPress(languageInfo)}>
      <Flex row gap="$spacing12">
        <Flex grow row gap="$spacing12">
          <Text variant="subheading1">{originName}</Text>
          {originName !== name ? (
            <Text color="$neutral3" variant="body1">
              {name}
            </Text>
          ) : null}
        </Flex>
        {active && <Check color={colors.accent1.val} size="$icon.16" />}
      </Flex>
    </TouchableArea>
  )
}
