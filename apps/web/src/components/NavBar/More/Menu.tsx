import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { Socials } from 'pages/Landing/sections/Footer'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useOpenModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ExternalLink, ThemedText } from 'theme/components'

import { menuContent, MenuItem, MenuSection } from './menuContent'
import { MobileAppLogo } from './MobileAppLogo'

const Container = styled.div`
  width: 295px;
  max-height: 85vh;
  padding: 24px;
  margin-top: 12px;
  margin-bottom: 8px;
  background: ${({ theme }) => theme.surface1};
  user-select: none;
  overflow: auto;
  ${ScrollBarStyles}
  height: unset;

  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  box-shadow: 0px 0px 10px 0px rgba(34, 34, 34, 0.04);

  position: absolute;
  right: 0px;
  top: 30px;
  bottom: unset;
  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    top: unset;
    bottom: 50px;
  }
`
const LinkStyles = css`
  font-size: 16px;
  text-decoration: none;
  color: ${({ theme }) => theme.neutral2};
  &:hover {
    color: ${({ theme }) => theme.accent1};
    opacity: 1;
  }
`
const StyledInternalLink = styled(Link)<{ canHide?: boolean }>`
  ${LinkStyles}
  @media screen and (max-width: ${BREAKPOINTS.md}px), (min-width: ${BREAKPOINTS.xl}px) {
    display: ${({ canHide }) => (canHide ? 'none' : 'block')};
  }
`
const StyledExternalLink = styled(ExternalLink)`
  ${LinkStyles}
`
const Separator = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.surface3};
`
const StyledRow = styled(Row)`
  cursor: pointer;
  :hover {
    color: ${({ theme }) => theme.accent1};
  }
`
const StyledSocials = styled(Socials)`
  height: 20px;
`
function Item({ label, href, internal, overflow, closeMenu }: MenuItem) {
  return internal ? (
    <StyledInternalLink to={href} canHide={overflow} onClick={closeMenu}>
      {label}
    </StyledInternalLink>
  ) : (
    <StyledExternalLink href={href}>{label}</StyledExternalLink>
  )
}
function Section({ title, items, closeMenu }: MenuSection) {
  return (
    <Column gap="sm">
      <ThemedText.SubHeader>{title}</ThemedText.SubHeader>
      {items.map((item, index) => (
        <Item
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
export function Menu({ close }: { close: () => void }) {
  const openGetTheAppModal = useOpenModal(ApplicationModal.GET_THE_APP)

  return (
    <Container data-testid="nav-more-menu">
      <Column gap="lg">
        {menuContent.map((sectionContent, index) => (
          <Section
            key={`menu_section_${index}`}
            title={sectionContent.title}
            items={sectionContent.items}
            closeMenu={close}
          />
        ))}
        <Separator />
        <StyledRow
          height="45px"
          gap="md"
          onClick={() => {
            close()
            openGetTheAppModal()
          }}
        >
          <MobileAppLogo />
          <Column gap="xs">
            <Text lineHeight="20px">
              <Trans>Download Uniswap</Trans>
            </Text>
            <ThemedText.LabelSmall lineHeight="18px">
              <Trans>Available on iOS and Android</Trans>
            </ThemedText.LabelSmall>
          </Column>
        </StyledRow>
        <StyledSocials iconSize="25px" />
      </Column>
    </Container>
  )
}
