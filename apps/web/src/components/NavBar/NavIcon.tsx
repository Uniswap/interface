import { t } from 'i18n'
import styled, { css } from 'lib/styled-components'
import { ReactNode } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const ContainerBase = css<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  position: relative;
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
`
const LegacyContainer = styled.div<{ $size: number; $isActive: boolean }>`
  ${ContainerBase}
  color: ${({ $isActive, theme }) => ($isActive ? theme.neutral1 : theme.neutral2)};
  border-radius: 16px;
  transform: translateY(-1px) translateX(4px);
`
const Container = styled.div<{ $size: number; $isActive: boolean }>`
  ${ContainerBase}
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

export const NavIcon = ({
  children,
  isActive = false,
  size = 40,
  label = t('common.navigationButton'),
  onClick,
}: NavIconProps) => {
  const isNavRefresh = useFeatureFlag(FeatureFlags.NavRefresh)
  return isNavRefresh ? (
    <Container $size={size} $isActive={isActive} onClick={onClick} aria-label={label}>
      {children}
    </Container>
  ) : (
    <LegacyContainer $size={size} $isActive={isActive} onClick={onClick} aria-label={label}>
      {children}
    </LegacyContainer>
  )
}
