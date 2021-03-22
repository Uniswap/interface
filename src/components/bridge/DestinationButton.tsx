import React from 'react'
import styled from 'styled-components'
import { Logo } from './styleds'
import { BridgeDirection } from '../../state/bridge/hooks'

export const Button = styled.button<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.95rem 1.25rem;
  background-color: ${({ theme }) => theme.bg12};
  border-radius: 16px;
  min-width: 160px;
  max-width: 100%;
  border-width: 2px;
  border-style: solid;
  color: ${({ color }) => color};
  border-color: ${({ theme }) => theme.bg12};
  font-weight: 500;
  outline: 0;

  &:hover {
    border-color: ${({ color }) => color};
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 130px;
  `}

  > img {
    margin-right: 0.5rem;
  }

  ${({ isActive, color }) => isActive && `border-color: ${color};`}
`

export default function DestinationButton({
  text,
  logoSrc,
  color,
  selectedBridgeDirection,
  handleClick,
  bridgeDirection
}: {
  text: string
  logoSrc: string
  color: string
  selectedBridgeDirection?: BridgeDirection
  handleClick: (...args: any[]) => void
  bridgeDirection: BridgeDirection
}) {
  return (
    <Button
      color={color}
      isActive={bridgeDirection === selectedBridgeDirection}
      onClick={() => handleClick(bridgeDirection)}
    >
      <Logo src={logoSrc} width={32} /> {text}
    </Button>
  )
}
