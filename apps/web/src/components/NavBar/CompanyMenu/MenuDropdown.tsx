import Column from 'components/Column'
import { MenuItem, MenuSection, useMenuContent } from 'components/NavBar/CompanyMenu/Content'
import { DownloadApp } from 'components/NavBar/CompanyMenu/DownloadAppCTA'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { useTabsContent } from 'components/NavBar/Tabs/TabsContent'
import { t } from 'i18next'
import styled, { css } from 'lib/styled-components'
import { Socials } from 'pages/Landing/sections/Footer'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Separator, ThemedText } from 'theme/components'

const Container = styled.div`
  width: 295px;
  padding: 24px;
  margin-bottom: 8px;
  user-select: none;
  overflow: auto;
  height: unset;
  border-radius: 12px;
`
const LinkStyles = css`
  font-size: 16px;
  text-decoration: none;
  color: ${({ theme }) => theme.neutral2};
  padding: 4px 0;
  &:hover {
    color: ${({ theme }) => theme.accent1};
    opacity: 1;
  }
`
const StyledInternalLink = styled(Link)`
  ${LinkStyles}
  padding: 0;
`
const StyledExternalLink = styled(ExternalLink)`
  ${LinkStyles}
  padding: 0;
`

export function MenuLink({ label, href, internal, closeMenu }: MenuItem) {
  return internal ? (
    <StyledInternalLink to={href} onClick={closeMenu}>
      {label}
    </StyledInternalLink>
  ) : (
    <StyledExternalLink href={href} onClick={closeMenu}>
      {label}
    </StyledExternalLink>
  )
}
function Section({ title, items, closeMenu }: MenuSection) {
  return (
    <Column gap="8px">
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
    </Column>
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
    <NavDropdown isOpen={false}>
      <Container data-testid="nav-more-menu">
        <Column gap="20px">
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
        </Column>
      </Container>
    </NavDropdown>
  )
}
