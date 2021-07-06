import styled from 'styled-components/macro'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Input from 'components/NumericalInput'

export const Wrapper = styled.div`
  position: relative;
  padding: 20px;
  min-width: 480px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 400px;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
  min-width: 340px;
`};
`

export const ScrollablePage = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.3' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
`

export const CurrencyDropdown = styled(CurrencyInputPanel)`
  width: 48.5%;
`

export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.bg0};
  text-align: left;
  font-size: 18px;
  width: 100%;
`
