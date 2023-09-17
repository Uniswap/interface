import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { useTogglePerpModal } from '../../state/application/hooks'
import Row, { AutoRow } from '../Row'

const NavFrame = styled(AutoRow)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    // position: fixed;
  `};
`

const NavLinks = styled(Row)`
  display: flex;
  align-items: center;
  justify-content: center;
  justify-self: center;
  margin: 0;
  border-radius: 20px;
  gap: 1rem;
  @media (max-width: 480px) {
    flex-flow: wrap;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: row;
    justify-content: space-around;
    justify-self: center;
    z-index: 99;
    position: fixed;
    padding: 0.5rem;
    bottom: 0; right: 50%;
    transform: translate(50%,-50%);
    margin: 0 auto;
    background-color: ${({ theme }) => (theme.darkMode ? theme.bg1 : theme.bg3)};
    width: 50%;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: calc(100% - 32px);
  `};
`
const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  outline: none;
  cursor: pointer;
  font-style: normal;
  font-weight: 400;
  text-align: center;
  text-decoration: none;
  padding: 8px 16px;
  word-break: break-word;
  white-space: nowrap;
  color: ${({ theme }) => theme.text2};
  height: 40px;

  &.${activeClassName} {
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => (theme.darkMode ? theme.bg2 : theme.bg0)};
    div {
      font-weight: 700;
    }
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0.5rem 1rem;
    &.${activeClassName} {
      background-color: ${({ theme }) => (theme.darkMode ? theme.bg6 : theme.bg0)};
    }
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    div:nth-child(2) {
      display: none;
    }
  `};
`

const StyledNavLinkAlt = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background-color: transparent;
  border-color: transparent;
  border-width: 0px;
  border-radius: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};
  font-style: normal;
  font-weight: 400;
  text-align: center;
  text-decoration: none;
  padding: 8px 16px;
  word-break: break-word;
  white-space: nowrap;
  height: 40px;

  &.${activeClassName} {
    color: ${({ theme }) => theme.text1};
    background-color: ${({ theme }) => (theme.darkMode ? theme.bg2 : theme.bg0)};
    border-radius: 20px;
    font-weight: 600;
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0.5rem 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    div:nth-child(2) {
      display: none;
    }
  `};
`

export default function NavigationLinks() {
  const togglePerpModal = useTogglePerpModal()

  const handleTogglePerpModal = () => {
    const tickingDate = localStorage.getItem('KromTOUTicked')

    if (tickingDate == null) {
      togglePerpModal()
    } else {
      const millis = Date.now() - (tickingDate as unknown as number)
      // External redirection
      if (Math.floor(millis / 1000 / 60 / 60 / 24) < 30) {
        window.open('https://perp.kromatika.finance/', '_blank')
      } else {
        togglePerpModal()
      }
    }
  }

  return (
    <NavFrame>
      <NavLinks>
        <StyledNavLink id={`swap-nav-link`} to={'/limitorder'}>
          <Text fontSize={16} fontWeight={400}>
            <Trans>Limit/FELO</Trans>
          </Text>
        </StyledNavLink>
        <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
          <Text fontSize={16} fontWeight={400}>
            <Trans>Swap</Trans>
          </Text>
        </StyledNavLink>
        <StyledNavLinkAlt id={`perp-nav-link`} onClick={() => handleTogglePerpModal()}>
          <Text
            fontSize={16}
            fontWeight={400}
            overflow={'hidden'}
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <Trans>Perpetuals</Trans>
          </Text>
        </StyledNavLinkAlt>
        <StyledNavLinkAlt
          id={`swap-nav-link`}
          onClick={() =>
            window.open(
              'https://apy.plasma.finance/#/quadrat/strategy/0x1Ce5B6cC76e49F2fad771c8C01607a9d987620E8?chainId=10',
              '_blank'
            )
          }
        >
          <Text fontSize={16} fontWeight={400}>
            <Trans>Liquidity Mining</Trans>
          </Text>
        </StyledNavLinkAlt>
      </NavLinks>
    </NavFrame>
  )
}
