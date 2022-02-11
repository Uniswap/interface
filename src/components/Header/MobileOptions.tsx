import React, { useRef } from 'react'
import styled from 'styled-components'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleMobileMenu } from '../../state/application/hooks'
import { ExternalLink } from '../../theme'
import { darken } from 'polished'
import { useTranslation } from 'react-i18next'

import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import Popover from '../Popover'

import { ReactComponent as ThreeBars } from '../../assets/svg/three-bars.svg'
import { ReactComponent as Cross } from '../../assets/svg/crossIcon.svg'

const StyledPopover = styled(Popover)`
  padding: 22px;
  border: none;
  background: ${({ theme }) => theme.bg1};
  border-radius: 12px;
`

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`

const ListItem = styled.li`
  & + & {
    margin-top: 28px;
  }
`

const StyledExternalLink = styled(ExternalLink)`
  display: block;
  font-weight: bold;
  font-size: 13px;
  line-height: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.text2};
  cursor: pointer;
  outline: none;

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text2)};
  }

  span {
    font-size: 11px;
  }
`

const MenuButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
  outline: none;

  svg {
    transform: rotate(180deg);
  }
`

export default function MobileOptions() {
  const popoverRef = useRef(null)
  const open = useModalOpen(ApplicationModal.MOBILE)
  const toggle = useToggleMobileMenu()

  const { t } = useTranslation()
  useOnClickOutside(popoverRef, open ? toggle : undefined)
  return (
    <div ref={popoverRef}>
      <StyledPopover
        show={open}
        placement="bottom-end"
        content={
          <>
            <List>
              <ListItem>
                <StyledExternalLink id="charts-nav-link" href="https://dxstats.eth.link/">
                  {t('charts')}
                  <span>↗</span>
                </StyledExternalLink>
              </ListItem>

              <ListItem>
                <StyledExternalLink id="stake-nav-link" href="https://snapshot.org/#/swpr.eth">
                  {t('vote')}
                </StyledExternalLink>
              </ListItem>
            </List>
          </>
        }
      >
        <MenuButton onClick={toggle}>{open ? <Cross /> : <ThreeBars />}</MenuButton>
      </StyledPopover>
    </div>
  )
}
