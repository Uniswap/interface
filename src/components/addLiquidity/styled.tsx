import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Input from 'components/NumericalInput'
import BodyWrapper from 'pages/AppBody'
import styled from 'styled-components/macro'

export const StyledBodyWrapper = styled(BodyWrapper)<{ $hasExistingPosition: boolean }>`
  padding: ${({ $hasExistingPosition }) => ($hasExistingPosition ? '10px' : 0)};
  min-width: ${({ theme }) => `${theme.breakpoint.xs}px`};
  max-width: ${({ theme }) => `${theme.breakpoint.sm}px`};
`
export const Wrapper = styled.div`
  position: relative;
  padding: 26px 16px;
`
export const ScrollablePage = styled.div`
  padding: 20px 8px 0px;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    margin: 0 auto;
  `};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
export const CurrencyDropdown = styled(CurrencyInputPanel)`
  width: 48.5%;
`
export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.backgroundSurface};
  text-align: left;
  font-size: 18px;
  width: 100%;
`
export const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.backgroundInteractive};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    margin-top: 0;
  `};
`
