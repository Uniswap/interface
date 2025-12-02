import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { HelpModal } from 'components/HelpModal/HelpModal'
import { MenuItem, MenuSection, MenuSectionTitle, useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { LegalAndPrivacyMenu } from 'components/NavBar/LegalAndPrivacyMenu'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import { Socials } from 'pages/Landing/sections/Footer'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ExternalLink } from 'theme/components/Links'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Flex, Separator, styled, Text } from 'ui/src'
import { TextVariantTokens } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const Container = styled(Flex, {
  width: '400px',
  p: '$gap16',
  userSelect: 'none',
  height: 'unset',
  borderRadius: '$rounded12',
  backgroundColor: '$surface2',
  boxShadow: '$shadow.1',
})

const LinkStyle = {
  textDecoration: 'none',
  height: 'unset',
  padding: 0,
}

const LinkTextStyle = {
  color: '$neutral1',
  hoverStyle: {
    opacity: 0.6,
  },
}

export function MenuLink({
  label,
  href,
  internal,
  closeMenu,
  textVariant = 'body3',
  icon,
}: MenuItem & { textVariant?: TextVariantTokens }) {
  return internal ? (
    <Link to={href} onClick={closeMenu} style={LinkStyle}>
      <Flex row gap="$gap8">
        {icon}
        <Text variant={textVariant} {...LinkTextStyle}>
          {label}
        </Text>
      </Flex>
    </Link>
  ) : (
    <ExternalLink href={href} onClick={closeMenu} style={{ ...LinkStyle, stroke: 'unset' }}>
      <Flex row gap="$gap8">
        {icon}
        <Text variant={textVariant} {...LinkTextStyle}>
          {label}
        </Text>
      </Flex>
    </ExternalLink>
  )
}
function Section({ title, items, closeMenu }: MenuSection) {
  return (
    <Flex gap="$spacing8" flex={1} data-testid={`menu-section-${title}`}>
      <Text variant="body4" color="$neutral2">
        {title}
      </Text>
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

function ProductSection({ items }: { items: MenuItem[] }) {
  const { t } = useTranslation()
  return (
    <Flex gap="$gap12" data-testid={`menu-section-${t('common.products')}`}>
      <Text variant="body4" color="$neutral2">
        {t('common.products')}
      </Text>
      <Flex row gap="$gap16" flexWrap="wrap">
        {items.map((item, index) => (
          <Anchor
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            {...ClickableTamaguiStyle}
            key={`${item.label}_${index}}`}
            aria-label={item.label}
          >
            <Flex row gap="$gap8" minWidth={168}>
              <Flex p="$padding6" borderRadius="$rounded8" backgroundColor="$accent2">
                {item.icon}
              </Flex>
              <Flex>
                <Text variant="body3">{item.label}</Text>
                <Text fontSize={10} lineHeight={14} color="$neutral2">
                  {item.body}
                </Text>
              </Flex>
            </Flex>
          </Anchor>
        ))}
      </Flex>
    </Flex>
  )
}

export function MenuDropdown({ close }: { close?: () => void }) {
  const { t } = useTranslation()
  const isConversionTrackingEnabled = useFeatureFlag(FeatureFlags.ConversionTracking)
  const menuContent = useMenuContent({
    keys: [MenuSectionTitle.Protocol, MenuSectionTitle.Company],
  })
  const productSection = useMenuContent({
    keys: [MenuSectionTitle.Products],
  })
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
    <NavDropdown isOpen={false} dataTestId={TestID.NavCompanyDropdown} borderColor="$surface3">
      <Container>
        <Flex gap="$spacing16">
          {productSection[MenuSectionTitle.Products] && (
            <ProductSection items={productSection[MenuSectionTitle.Products].items} />
          )}
          {!areTabsVisible && <Section title={t('common.app')} items={tabsMenuItems} closeMenu={close} />}
          <Separator />
          <Flex row>
            {Object.values(menuContent).map((sectionContent, index) => (
              <Section
                key={`menu_section_${index}`}
                title={sectionContent.title}
                items={sectionContent.items}
                closeMenu={close}
              />
            ))}
          </Flex>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            $xl={{ flexDirection: 'column', gap: '$spacing16', alignItems: 'flex-start' }}
          >
            {isConversionTrackingEnabled && (
              <Flex flex={1}>
                <LegalAndPrivacyMenu closeMenu={close} />
              </Flex>
            )}
            <Flex row alignSelf="flex-end" alignItems="center" justifyContent="space-between" $xl={{ width: '100%' }}>
              <Flex display="none" $xl={{ display: 'flex' }}>
                <HelpModal showOnXL />
              </Flex>
              <Socials iconSize="18px" gap="$spacing12" />
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </NavDropdown>
  )
}
