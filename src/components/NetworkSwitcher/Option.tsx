import React from 'react'
import styled from 'styled-components'
import { AutoRow } from '../Row'
import { NetworkOptions } from './NetworkSwitcher.types'
import { StyledConnectedIcon } from '../../utils'

const InfoCard = styled.button<{ active?: boolean, connected?: boolean }>`
  background-color: transparent;
  outline: none;
  border: none;
  border-radius: 8px;
  width: 100% !important;
  padding-left: ${props => (props.connected ? "0px" : null)};
`

const OptionCard = styled(InfoCard)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const OptionCardClickable = styled(OptionCard)`
  transition: border 0.3s ease;
  color: white;
  cursor: pointer;

  &:disabled {
    filter: grayscale(90%);
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const HeaderText = styled.div<{ connected?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
  margin-left: ${props => (props.connected ? "4px" : "10px")};;
`

const Icon = styled.img`
  width: 20px;
`

export default function Option({ preset, onClick, active = false, disabled = false, connected = false }: NetworkOptions) {
  const { logoSrc, name } = preset
  return (
    <OptionCardClickable onClick={onClick} disabled={disabled} active={active} connected={connected}>
      <OptionCardLeft>
        <AutoRow>
          {connected && <StyledConnectedIcon margin="0 5px 0 0"/>}
          {logoSrc && <Icon src={logoSrc} alt={'Icon'} />}
          <HeaderText connected={connected}>{name}</HeaderText>
        </AutoRow>
      </OptionCardLeft>
    </OptionCardClickable>
  )
}
