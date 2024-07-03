import { t } from 'i18n'
import { ReactNode } from 'react'
import styled from 'styled-components'

const Container = styled.div<{ $size: number; $isActive: boolean }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  color: ${({ $isActive, theme }) => ($isActive ? theme.neutral1 : theme.neutral2)};
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  border-radius: 16px;
  transition: 250;
  z-index: 1;
  transform: translateY(-1px) translateX(4px);
`

interface NavIconProps {
  children: ReactNode
  size?: number
  isActive?: boolean
  label?: string
  onClick: () => void
}

export const NavIcon = ({
  children,
  isActive = false,
  size = 40,
  label = t('common.navigationButton'),
  onClick,
}: NavIconProps) => {
  return (
    <Container $size={size} $isActive={isActive} onClick={onClick} aria-label={label}>
      {children}
    </Container>
  )
}
