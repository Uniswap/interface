import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const Container = styled.div<{ $size: number; $isActive: boolean }>`
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 250ms;
  z-index: 1;
  background-color: ${({ $isActive, theme }) => ($isActive ? theme.surface1Hovered : 'transparent')};
  color: ${({ theme }) => theme.neutral2};
  border-radius: 50%;
  &:hover {
    background-color: ${({ theme }) => theme.surface1Hovered};
  }
`

interface NavIconProps {
  children: ReactNode
  size?: number
  isActive?: boolean
  label?: string
  onClick?: () => void
}

export const NavIcon = ({ children, isActive = false, size = 40, label, onClick }: NavIconProps) => {
  const { t } = useTranslation()
  const labelWithDefault = label ?? t('common.navigationButton')
  return (
    <Container $size={size} $isActive={isActive} onClick={onClick} aria-label={labelWithDefault}>
      {children}
    </Container>
  )
}
