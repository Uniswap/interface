import { MenuItem, MenuSection, useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { DownloadApp } from 'components/NavBar/CompanyMenu/DownloadAppCTA'
import { LegalAndPrivacyMenu } from 'components/NavBar/LegalAndPrivacyMenu'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import { Socials } from 'pages/Landing/sections/Footer'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ExternalLink, Separator, ThemedText } from 'theme/components'
import { Flex, Text, styled } from 'ui/src'
import { TextVariantTokens } from 'ui/src/theme'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const Container = styled(Flex, {
  width: '295px',
  p: '$gap24',
  mb: '$gap8',
  userSelect: 'none',
  height: 'unset',
  borderRadius: '$rounded12',
})

const LinkStyle = {
  textDecoration: 'none',
  height: 'unset',
  padding: 0,
}

const LinkTextStyle = {
  color: '$neutral2',
  hoverStyle: {
    opacity: 0.6,
  },
}

export function MenuLink({
  label,
  href,
  internal,
  closeMenu,
  textVariant = 'subheading1',
}: MenuItem & { textVariant?: TextVariantTokens }) {
  return internal ? (
    <Link to={href} onClick={closeMenu} style={LinkStyle}>
      <Text variant={textVariant} {...LinkTextStyle}>
        {label}
      </Text>
    </Link>
  ) : (
    <ExternalLink href={href} onClick={closeMenu} style={LinkStyle}>
      <Text variant={textVariant} {...LinkTextStyle}>
        {label}
      </Text>
    </ExternalLink>
  )
}
function Section({ title, items, closeMenu }: MenuSection) {
  return (
    <Flex gap="$spacing8">
      <ThemedText.SubHeader>{title}</ThemedText.SubHeader>
      {items.map((item, index) => (
        <MenuLink
          key={`${title}_${index}}`}
          label={item.label}
          href={item.href}
          internal={item.internal}
          overflow={item.overflow}
          closeMenu={closeMenu}
        />
      ))}
    </Flex>
  )
}
export function MenuDropdown({ close }: { close?: () => void }) {
  const { t } = useTranslation()
  const isConversionTrackingEnabled = useFeatureFlag(FeatureFlags.ConversionTracking)
  const menuContent = useMenuContent()
  const areTabsVisible = useTabsVisible()
  const tabs = useTabsContent()
  const tabsMenuItems = useMemo(() => {
    return tabs.map((tab) => {
      return {
        label: tab.title,
        href: tab.href,
        internal: true,
        overflow: false,
      }
    })
  }, [tabs])

  return (
    <NavDropdown isOpen={false} dataTestId="nav-company-dropdown">
      <Container>
        <Flex gap="$spacing20">
          {!areTabsVisible && <Section title={t('common.app')} items={tabsMenuItems} closeMenu={close} />}
          {menuContent.map((sectionContent, index) => (
            <Section
              key={`menu_section_${index}`}
              title={sectionContent.title}
              items={sectionContent.items}
              closeMenu={close}
            />
          ))}
          <Separator />
          <DownloadApp onClick={close} />
          <Socials iconSize="25px" />
          {isConversionTrackingEnabled && <LegalAndPrivacyMenu closeMenu={close} />}
        </Flex>
      </Container>
    </NavDropdown>
  )
}
