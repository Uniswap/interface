import { ChainId } from '@swapr/sdk'
import React from 'react'
import styled from 'styled-components'
import { ButtonPrimary } from '../../components/Button'
import { networkOptionsPreset } from '../../components/NetworkSwitcher'

interface GradientButtonProps {
  from: string
  to: string
}

const GradientButton = styled(ButtonPrimary)<GradientButtonProps>`
  background-image: ${({ from, to, disabled }) => !disabled && `linear-gradient(90deg, ${from} -26.1%, ${to} 151.96%)`};
`

interface BridgeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Partial<Record<'from' | 'to', ChainId>> {}

const getColor = (network?: ChainId): string =>
  network ? networkOptionsPreset[network]?.color || '#2E17F2' : '#2E17F2'

export const BridgeButton = ({ onClick, disabled, children, from, to }: BridgeButtonProps) => {
  return (
    <GradientButton onClick={onClick} mt="12px" disabled={disabled} from={getColor(from)} to={getColor(to)}>
      {children}
    </GradientButton>
  )
}
