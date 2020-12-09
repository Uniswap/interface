import React, { useRef } from 'react'
import styled from 'styled-components'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleMobileMenu } from '../../state/application/hooks'
import { ExternalLink } from '../../theme'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { MoreHorizontal, X } from 'react-feather'
import { RowFixed } from '../Row'
import { darken } from 'polished'
import { GovernanceText } from './styleds'

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuContainer = styled.span`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 4rem;
  right: 0rem;
  width: 169px;
  z-index: 100;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    position: fixed;
    top: calc(4rem + 50px);
    right: calc(50vw - 90px);
    align-items: center;
  `};
`

const MenuFlyout = styled.span`
  background-color: ${({ theme }) => theme.bg2};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  height: auto;
  padding: 0.5rem;
`

const ComingSoonBadge = styled.div`
  self-align: center;
  font-size: 9px;
  text-align: center;
  background-color: ${({ theme }) => theme.bg4};
  border-radius: 3px;

  width: fit-content;
  margin: auto;
  padding: 2px 5px;
`

const StyledNavLinkWithBadge = styled.a`
  top: 7px;
  position: relative;
  margin: 0px 12px;
  cursor: default;
`

const StyledExternalLink = styled(ExternalLink)<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

export default function MobileOptions() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MOBILE)
  const toggle = useToggleMobileMenu()
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <MoreHorizontal size={24} onClick={toggle} />
      {open && (
        <MenuContainer>
          <MenuFlyout>
            <RowFixed style={{ alignSelf: 'center', margin: '1rem' }}>
              <StyledNavLinkWithBadge href="/#">
                <GovernanceText>Governance</GovernanceText>
                <ComingSoonBadge>COMING SOON</ComingSoonBadge>
              </StyledNavLinkWithBadge>
            </RowFixed>
            <RowFixed style={{ alignSelf: 'center', margin: '1rem' }}>
              <StyledExternalLink id={`stake-nav-link`} href={'https://dxstats.eth.link/'}>
                Charts <span style={{ fontSize: '11px' }}>↗</span>
              </StyledExternalLink>
            </RowFixed>
            <RowFixed style={{ alignSelf: 'center', margin: '1rem' }}>
              <X size={24} onClick={toggle} />
            </RowFixed>
          </MenuFlyout>
        </MenuContainer>
      )}
    </StyledMenu>
  )
}
