import { MenuItem, useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { MenuLink } from 'components/NavBar/CompanyMenu/MenuDropdown'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import deprecatedStyled from 'lib/styled-components'
import { Discord, Github, Twitter } from 'pages/Landing/components/Icons'
import { Wiggle } from 'pages/Landing/components/animations'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTogglePrivacyPolicy } from 'state/application/hooks'
import { Anchor, Flex, Separator, Text, styled } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

const SOCIAL_ICONS_SIZE = `${iconSizes.icon32}px`

const SocialIcon = deprecatedStyled(Wiggle)`
  flex: 0;
  fill: ${(props) => props.theme.neutral1};
  cursor: pointer;
  transition: fill;
  transition-duration: 0.2s;
  &:hover {
    fill: ${(props) => props.$hoverColor};
  }
`
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
      <SocialIcon $hoverColor="#00C32B">
        <Anchor href="https://github.com/Uniswap" target="_blank">
          <Github size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
      <SocialIcon $hoverColor="#20BAFF">
        <Anchor href="https://x.com/Uniswap" target="_blank">
          <Twitter size={iconSize} fill="inherit" />
        </Anchor>
      </SocialIcon>
      <SocialIcon $hoverColor="#5F51FF">
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
      <Text variant="body1">{title}</Text>
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
  const togglePrivacyPolicy = useTogglePrivacyPolicy()
  const tabsContent = useTabsContent()
  const appSectionItems: MenuItem[] = useMemo(() => {
    return tabsContent.map((tab) => ({
      label: tab.title,
      href: tab.href,
      internal: true,
    }))
  }, [tabsContent])
  const sections = useMenuContent()
  const brandAssets = {
    label: t('common.brandAssets'),
    href: 'https://github.com/Uniswap/brand-assets/raw/main/Uniswap%20Brand%20Assets.zip',
    internal: false,
  }

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
            <FooterSection title={t('common.app')} items={appSectionItems} />
            <FooterSection title={sections[0].title} items={[...sections[0].items, brandAssets]} />
          </Flex>
          <Flex row gap="$spacing16" $md={{ width: 'auto' }}>
            <FooterSection title={sections[1].title} items={sections[1].items} />
            <FooterSection title={sections[2].title} items={sections[2].items} />
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
        <Text variant="body3">© 2024 - Uniswap Labs</Text>
        <Flex row alignItems="center" gap="$spacing16">
          <Anchor textDecorationLine="none" href="https://uniswap.org/trademark" target="_blank">
            <PolicyLink>{t('common.trademarkPolicy')}</PolicyLink>
          </Anchor>
          <PolicyLink onPress={togglePrivacyPolicy}>{t('common.privacyPolicy')}</PolicyLink>
        </Flex>
      </Flex>
    </Flex>
  )
}
