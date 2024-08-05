import { MenuItem, MenuSection, useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { DownloadApp } from 'components/NavBar/CompanyMenu/DownloadAppCTA'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import styled, { css } from 'lib/styled-components'
import { Socials } from 'pages/Landing/sections/Footer'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Separator, ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import { t } from 'uniswap/src/i18n'

const Container = styled.div`
  width: 295px;
  padding: 24px;
  margin-bottom: 8px;
  user-select: none;
  overflow: auto;
  height: unset;
  border-radius: 12px;
`
const LinkStyles = css<{ $hoverColor?: string }>`
  font-size: 16px;
  text-decoration: none;
  color: ${({ theme }) => theme.neutral2};
  transition: color ${({ theme }) => theme.transition.duration.fast};
  padding: 4px 0;
  &:hover {
    color: ${({ theme, $hoverColor }) => $hoverColor || theme.accent1};
    opacity: 1;
  }
`
const StyledInternalLink = styled(Link)<{ $hoverColor?: string }>`
  ${LinkStyles}
  padding: 0;
`
const StyledExternalLink = styled(ExternalLink)<{ $hoverColor?: string }>`
  ${LinkStyles}
  padding: 0;
`

export function MenuLink({ label, href, internal, $hoverColor, closeMenu }: MenuItem & { $hoverColor?: string }) {
  return internal ? (
    <StyledInternalLink to={href} onClick={closeMenu} $hoverColor={$hoverColor}>
      {label}
    </StyledInternalLink>
  ) : (
    <StyledExternalLink href={href} onClick={closeMenu} $hoverColor={$hoverColor}>
      {label}
    </StyledExternalLink>
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
  const menuContent = useMenuContent()
  const areTabsVisible = useTabsVisible()
  const tabs = useTabsContent()
  const tabsMenuItems = useMemo(() => {
    return tabs.map((t) => {
      return {
        label: t.title,
        href: t.href,
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
        </Flex>
      </Container>
    </NavDropdown>
  )
}
