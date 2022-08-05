import { lighten, rgba } from 'polished'
import { Flex } from 'rebass'
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

export const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const CurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
`

export const SearchWrapper = styled(Flex)`
  align-items: center;
  gap: 12px;
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
