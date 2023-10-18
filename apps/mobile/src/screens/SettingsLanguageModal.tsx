import React, { useCallback } from 'react'
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
import { useCurrentLanguage, useLanguageInfo } from 'wallet/src/features/language/hooks'
import { setCurrentLanguage } from 'wallet/src/features/language/slice'

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
  const { t } = useTranslation()
  const selectedLanguge = useCurrentLanguage()

  return (
    <Flex pb="$spacing32" px="$spacing16">
      <Text pb="$spacing12" textAlign="center" variant="subheading1">
        {t('Language')}
      </Text>
      {ORDERED_LANGUAGES.map((language) => (
        <LanguageOption
          active={selectedLanguge === language}
          language={language}
          onPress={onClose}
        />
      ))}
    </Flex>
  )
}

interface LanguageOptionProps {
  active?: boolean
  language: Language
  onPress: () => void
}

function LanguageOption({ active, language, onPress }: LanguageOptionProps): JSX.Element {
  const dispatch = useAppDispatch()
  const { i18n } = useTranslation()
  const colors = useSporeColors()
  const { name, originName, locale } = useLanguageInfo(language)

  const changeLanguage = useCallback(() => {
    i18n
      .changeLanguage(locale)
      .then(() => {
        dispatch(setCurrentLanguage(language))
        onPress()
      })
      .catch(() => {
        logger.warn('SettingsLanguageModal', 'LanguageOption', 'Failed to change language')
      })
  }, [i18n, language, locale, dispatch, onPress])

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      px="$spacing12"
      py="$spacing12"
      onPress={changeLanguage}>
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
