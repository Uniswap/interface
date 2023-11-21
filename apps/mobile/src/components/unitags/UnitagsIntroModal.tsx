import React from 'react'
import { useTranslation } from 'react-i18next'
import 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { closeModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { Screens, UnitagScreens } from 'src/screens/Screens'
import { Button, Flex, GeneratedIcon, Icons, Image, Text } from 'ui/src'
import { UNITAGS_BANNER_HORIZONTAL } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'

export function UnitagsIntroModal(): JSX.Element {
  const { t } = useTranslation()
  const appDispatch = useAppDispatch()

  const onClose = (): void => {
    appDispatch(closeModal({ name: ModalName.UnitagsIntro }))
  }

  const onPressClaimOneNow = (): void => {
    navigate(Screens.UnitagStack, {
      screen: UnitagScreens.ClaimUnitag,
      params: {
        entryPoint: Screens.Home,
      },
    })
    onClose()
  }

  const onPressMaybeLater = (): void => {
    onClose()
  }

  return (
    <BottomSheetModal name={ModalName.UnitagsIntro} onClose={onClose}>
      <Flex gap="$spacing32" mb="$spacing24" px="$spacing24" py="$spacing12">
        <Flex alignItems="center" gap="$spacing8" pt="$spacing32">
          <Flex maxHeight={70}>
            <Image maxHeight={70} resizeMode="contain" source={UNITAGS_BANNER_HORIZONTAL} />
          </Flex>
          <Text variant="heading3">{t('Introducing Usernames')}</Text>
        </Flex>
        <Flex gap="$spacing16" p="$spacing12">
          <BodyItem
            Icon={Icons.Quotes}
            subtitle={t('Say goodbye to copying, pasting, and triple-checking 0x addresses.')}
            title={t('Human readable')}
          />
          <BodyItem
            Icon={Icons.Photo}
            subtitle={t('Upload an avatar, create a bio, and link your socials.')}
            title={t('Customizable profile')}
          />
          <BodyItem
            Icon={Icons.Ticket}
            subtitle={t('Create your unique username for free, no network fees involved.')}
            title={t('Free to claim')}
          />
          <BodyItem
            Icon={Icons.Lightning}
            subtitle={t('Uniswap usernames are built on top of ENS subdomains.')}
            title={t('Powered by ENS')}
          />
        </Flex>
        <Flex gap="$spacing16" mt="$spacing16">
          <Button size="large" theme="primary" onPress={onPressClaimOneNow}>
            {t('Claim one now')}
          </Button>
          <Button size="large" theme="secondary" onPress={onPressMaybeLater}>
            {t('Maybe later')}
          </Button>
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function BodyItem({
  Icon,
  title,
  subtitle,
}: {
  Icon: GeneratedIcon
  title: string
  subtitle: string
}): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing16">
      <Icon color="$accent1" size={iconSizes.icon24} strokeWidth={2} />
      <Flex fill gap="$spacing8">
        <Text color="$accent1" variant="subheading2">
          {title}
        </Text>
        <Text color="$neutral2" variant="body3">
          {subtitle}
        </Text>
      </Flex>
    </Flex>
  )
}
