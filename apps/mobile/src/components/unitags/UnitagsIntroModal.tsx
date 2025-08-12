import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { useTranslation } from 'react-i18next'
import 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { TermsOfService } from 'src/screens/Onboarding/TermsOfService'
import { Button, Flex, GeneratedIcon, Image, Text, useIsDarkMode } from 'ui/src'
import { UNITAGS_INTRO_BANNER_DARK, UNITAGS_INTRO_BANNER_LIGHT } from 'ui/src/assets'
import { Lightning, Person, Ticket } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { setHasCompletedUnitagsIntroModal } from 'wallet/src/features/behaviorHistory/slice'

export function UnitagsIntroModal({ route }: AppStackScreenProp<typeof ModalName.UnitagsIntro>): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const appDispatch = useDispatch()
  const { onClose } = useReactNavigationModal()

  const params = route.params
  const address = params.address
  const entryPoint = params.entryPoint

  const onPressClaimOneNow = (): void => {
    appDispatch(setHasCompletedUnitagsIntroModal(true))
    onClose()
    navigate(MobileScreens.UnitagStack, {
      screen: UnitagScreens.ClaimUnitag,
      params: {
        entryPoint,
        address,
      },
    })
    if (address) {
      sendAnalyticsEvent(SharedEventName.TERMS_OF_SERVICE_ACCEPTED, { address })
    }
  }

  return (
    <Modal name={ModalName.UnitagsIntro} onClose={onClose}>
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
          <BodyItem Icon={Person} title={t('unitags.intro.features.profile')} />
          <BodyItem Icon={Ticket} title={t('unitags.intro.features.free')} />
          <BodyItem Icon={Lightning} title={t('unitags.intro.features.ens')} />
        </Flex>
        <Flex row gap="$spacing8">
          <Button variant="branded" emphasis="primary" size="large" onPress={onPressClaimOneNow}>
            {t('common.button.continue')}
          </Button>
        </Flex>
        <Flex $short={{ py: '$none', mx: '$spacing12' }} mx="$spacing24">
          <TermsOfService />
        </Flex>
      </Flex>
    </Modal>
  )
}

function BodyItem({ Icon, title }: { Icon: GeneratedIcon; title: string }): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing16">
      <Icon color="$accent1" size="$icon.20" strokeWidth={2} />
      <Text color="$neutral2" variant="body3">
        {title}
      </Text>
    </Flex>
  )
}
