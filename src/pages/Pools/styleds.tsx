import { lighten, rgba } from 'polished'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'

export const PoolsPageWrapper = styled.div`
  padding: 32px 24px 50px;
  width: 100%;
  max-width: 1500px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}

  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const CurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
`

export const SelectPairInstructionWrapper = styled.div`
  text-align: center;
  height: 100%;
  padding: 24px;
`

export const IconWrapper = styled.div`
  border-radius: 50%;
  background: ${({ theme }) => theme.apr};
  width: 18px;
  height: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const ButtonIcon = styled(ButtonEmpty)`
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  width: 28px;
  min-width: 28px;
  height: 28px;
  min-height: 28px;
  border-radius: 50%;
  padding: 0;
  color: ${({ theme }) => theme.subText} !important;

  :hover {
    background: ${({ theme }) => lighten(0.4, rgba(theme.subText, 0.2))};
  }
`

export const Tab = styled.div<{ active?: boolean }>`
  height: 36px;
  padding: 8px 12px;
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  background: ${({ theme, active }) => (active ? theme.primary + '33' : 'transparent')};
  border-radius: 999px;
  cursor: pointer;
  color: ${({ active, theme }) => (active ? theme.primary : theme.subText)};
  font-weight: 500;
  font-size: 14px;
  display: flex;
  align-items: center;
`
