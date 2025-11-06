import { Wiggle } from 'components/animations/Wiggle'
import { MenuItem, MenuSectionTitle, useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { MenuLink } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { useModalState } from 'hooks/useModalState'
import { Discord, Github, Twitter } from 'pages/Landing/components/Icons'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, FlexProps, Separator, styled, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const SOCIAL_ICONS_SIZE = `${iconSizes.icon32}px`

const SocialIcon = styled(Wiggle, {
  cursor: 'pointer',
  flex: 0,
})

const PolicyLink = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  cursor: 'pointer',
  hoverStyle: { color: '$neutral1' },
  // Tamagui bug. Animation property breaks theme value transition, needs to use style instead
  style: { transition: '100ms' },
})

export function Socials({ iconSize, gap }: { iconSize?: string; gap?: FlexProps['gap'] }) {
  return (
    <Flex row gap={gap ?? '$spacing24'} maxHeight={iconSize} alignItems="flex-start">
      <SocialIcon iconColor="#00C32B">
        <Anchor href="https://github.com/Uniswap" target="_blank">
          <Github size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
      <SocialIcon iconColor="#20BAFF">
        <Anchor href="https://x.com/Uniswap" target="_blank">
          <Twitter size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
      <SocialIcon iconColor="#5F51FF">
        <Anchor href="https://discord.com/invite/uniswap" target="_blank">
          <Discord size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
    </Flex>
  )
}

function FooterSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <Flex width={130} $md={{ width: '100%' }} flexGrow={0} flexShrink={1} flexBasis="auto" gap={8}>
      <Text variant="subheading2">{title}</Text>
      <Flex gap={5}>
        {items.map((item, index) => (
          <MenuLink
            key={`footer_${title}_${index}}`}
            label={item.label}
            href={item.href}
            internal={item.internal}
            overflow={item.overflow}
            textVariant="subheading2"
          />
        ))}
      </Flex>
    </Flex>
  )
}

export function Footer() {
  const { t } = useTranslation()
  const { toggleModal: togglePrivacyPolicy } = useModalState(ModalName.PrivacyPolicy)
  const sectionContent = useMenuContent()
  const productsSection = sectionContent[MenuSectionTitle.Products]
  const protocolSection = sectionContent[MenuSectionTitle.Protocol]
  const companySection = sectionContent[MenuSectionTitle.Company]
  const needHelpSection = sectionContent[MenuSectionTitle.NeedHelp]
  const brandAssets = {
    label: t('common.brandAssets'),
    href: 'https://github.com/Uniswap/brand-assets/raw/main/Uniswap%20Brand%20Assets.zip',
    internal: false,
  }
  const currentYear = new Date().getFullYear()

  return (
    <Flex maxWidth="100vw" width="100%" gap="$spacing24" pt="$none" px="$spacing48" pb={40} $lg={{ px: '$spacing40' }}>
      <Flex row $md={{ flexDirection: 'column' }} justifyContent="space-between" gap="$spacing32">
        <Flex height="100%" gap="$spacing60">
          <Flex $md={{ display: 'none' }}>
            <Socials iconSize={SOCIAL_ICONS_SIZE} />
          </Flex>
        </Flex>
        <Flex row $md={{ flexDirection: 'column' }} height="100%" gap="$spacing16">
          <Flex row gap="$spacing16" justifyContent="space-between" $md={{ width: 'auto' }}>
            {productsSection && <FooterSection title={productsSection.title} items={productsSection.items} />}
            {protocolSection && <FooterSection title={protocolSection.title} items={protocolSection.items} />}
          </Flex>
          <Flex row gap="$spacing16" $md={{ width: 'auto' }}>
            {companySection && (
              <FooterSection title={companySection.title} items={[...companySection.items, brandAssets]} />
            )}
            {needHelpSection && <FooterSection title={needHelpSection.title} items={needHelpSection.items} />}
          </Flex>
        </Flex>
        <Flex $md={{ display: 'flex' }} display="none">
          <Socials iconSize={SOCIAL_ICONS_SIZE} />
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
        <Text variant="body3">© {currentYear} - Uniswap Labs</Text>
        <Flex row alignItems="center" gap="$spacing16">
          <PolicyLink onPress={togglePrivacyPolicy}>{t('common.privacyPolicy')}</PolicyLink>
          <Anchor textDecorationLine="none" href="https://uniswap.org/trademark" target="_blank">
            <PolicyLink>{t('common.trademarkPolicy')}</PolicyLink>
          </Anchor>
        </Flex>
      </Flex>
    </Flex>
  )
}
