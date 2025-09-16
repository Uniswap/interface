import { Wiggle } from 'components/animations/Wiggle'
import { useModalState } from 'hooks/useModalState'
import { Github, Telegram, Twitter } from 'pages/Landing/components/Icons'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Separator, Text, styled } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const SOCIAL_ICONS_SIZE = `${iconSizes.icon32}px`

const SocialIcon = styled(Wiggle, {
  cursor: 'pointer',
  flex: 0,
})

const PolicyLink = styled(Text, {
  variant: 'body3',
  animation: '100ms',
  color: '$neutral2',
  cursor: 'pointer',
  hoverStyle: { color: '$neutral1' },
})

export function Socials({ iconSize }: { iconSize?: string }) {
  return (
    <Flex row gap="$spacing24" maxHeight={iconSize} alignItems="flex-start">
      <SocialIcon iconColor="#F7911A">
        <Anchor href={uniswapUrls.social.github} target="_blank">
          <Github size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
      <SocialIcon iconColor="#F7911A">
        <Anchor href={uniswapUrls.social.x} target="_blank">
          <Twitter size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
      <SocialIcon iconColor="#F7911A">
        <Anchor href={uniswapUrls.social.telegram} target="_blank">
          <Telegram size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
    </Flex>
  )
}

export function Footer() {
  const { t } = useTranslation()
  const { toggleModal: togglePrivacyPolicy } = useModalState(ModalName.PrivacyPolicy)
  const currentYear = new Date().getFullYear()

  return (
    <Flex maxWidth="100vw" width="100%" gap="$spacing24" pt="$none" px="$spacing48" pb={40} $lg={{ px: '$spacing40' }}>
      <Flex row $md={{ flexDirection: 'column' }} justifyContent="space-between" gap="$spacing32">
        <Flex height="100%" gap="$spacing60">
          <Flex>
            <Socials iconSize={SOCIAL_ICONS_SIZE} />
          </Flex>
        </Flex>
      </Flex>
      <Separator />
      <Flex
        row
        alignItems="center"
        $md={{ flexDirection: 'column', alignItems: 'flex-start' }}
        width="100%"
        justifyContent="space-between"
      >
        <Text variant="body3">© {currentYear} - JuiceSwap Labs</Text>
        <Flex row alignItems="center" gap="$spacing16">
          <PolicyLink onPress={togglePrivacyPolicy}>{t('common.privacyPolicy')}</PolicyLink>
          <Anchor
            textDecorationLine="none"
            href="https://github.com/JuiceSwapxyz/documentation/tree/main/media_kit"
            target="_blank"
          >
            <PolicyLink>{t('common.brandAssets')}</PolicyLink>
          </Anchor>
        </Flex>
      </Flex>
    </Flex>
  )
}
