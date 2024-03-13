import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { useTranslation } from 'react-i18next'
import 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { TermsOfService } from 'src/screens/Onboarding/TermsOfService'
import { Screens, UnitagScreens } from 'src/screens/Screens'
import { Button, Flex, GeneratedIcon, Icons, Image, Text, useIsDarkMode } from 'ui/src'
import { UNITAGS_INTRO_BANNER_DARK, UNITAGS_INTRO_BANNER_LIGHT } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { setHasCompletedUnitagsIntroModal } from 'wallet/src/features/behaviorHistory/slice'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { ModalName } from 'wallet/src/telemetry/constants'

export function UnitagsIntroModal(): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const appDispatch = useAppDispatch()
  const modalState = useAppSelector(selectModalState(ModalName.UnitagsIntro)).initialState
  const address = modalState?.address
  const entryPoint = modalState?.entryPoint

  const onClose = (): void => {
    appDispatch(closeModal({ name: ModalName.UnitagsIntro }))
  }

  const onPressClaimOneNow = (): void => {
    if (!entryPoint) {
      throw new Error('Missing entry point in UnitagsIntroModal')
    }

    appDispatch(setHasCompletedUnitagsIntroModal(true))
    navigate(Screens.UnitagStack, {
      screen: UnitagScreens.ClaimUnitag,
      params: {
        entryPoint,
        address,
      },
    })
    if (address) {
      sendWalletAnalyticsEvent(SharedEventName.TERMS_OF_SERVICE_ACCEPTED, { address })
    }
    onClose()
  }

  return (
    <BottomSheetModal name={ModalName.UnitagsIntro} onClose={onClose}>
      <Flex gap="$spacing24" px="$spacing24" py="$spacing16">
        <Flex alignItems="center" gap="$spacing12">
          <Text variant="subheading1">{t('unitags.intro.title')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t('unitags.intro.subtitle')}
          </Text>
        </Flex>
        <Flex alignItems="center" maxHeight={105}>
          <Image
            maxHeight={105}
            resizeMode="contain"
            source={isDarkMode ? UNITAGS_INTRO_BANNER_DARK : UNITAGS_INTRO_BANNER_LIGHT}
          />
        </Flex>
        <Flex gap="$spacing16" px="$spacing20">
          <BodyItem Icon={Icons.UserSquare} title={t('unitags.intro.features.profile')} />
          <BodyItem Icon={Icons.Ticket} title={t('unitags.intro.features.free')} />
          <BodyItem Icon={Icons.Lightning} title={t('unitags.intro.features.ens')} />
        </Flex>
        <Flex gap="$spacing8">
          <Button size="medium" theme="primary" onPress={onPressClaimOneNow}>
            {t('common.button.continue')}
          </Button>
        </Flex>
        <Flex $short={{ py: '$none', mx: '$spacing12' }} mx="$spacing24">
          <TermsOfService />
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function BodyItem({ Icon, title }: { Icon: GeneratedIcon; title: string }): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing16">
      <Icon color="$accent1" size={iconSizes.icon20} strokeWidth={2} />
      <Text color="$neutral2" variant="body3">
        {title}
      </Text>
    </Flex>
  )
}
