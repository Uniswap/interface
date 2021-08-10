import React from 'react'
import styled from 'styled-components';
import { ButtonPrimary } from '../../components/Button'

interface GradientButtonProps {
  from: string
  to: string
}

const GradientButton = styled(ButtonPrimary)<GradientButtonProps>`
  background-image: ${({from, to, disabled}) => !disabled && `linear-gradient(90deg, ${from} -26.1%, ${to} 151.96%)`};
`;

interface BridgeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, GradientButtonProps {}

export const BridgeButton = ({onClick, disabled, children, from, to}: BridgeButtonProps) => {
  const getColor = (network: string) => {
    switch (network) {
      case 'Ethereum':
        return '#627EEA'
      case 'Arbitrum':
        return '#2C374B'
      default:
        return '#2E17F2';
    }
  }
  
  return (
    <GradientButton
      onClick={onClick}
      mt="12px"
      disabled={disabled}
      from={getColor(from)}
      to={getColor(to)}
    >
     {children}
    </GradientButton>
  )
}
