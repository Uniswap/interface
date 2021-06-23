import styled from 'styled-components/macro'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { DarkGreyCard } from 'components/Card'
import Input from 'components/NumericalInput'
import { BodyWrapper } from 'pages/AppBody'

export const PageWrapper = styled(BodyWrapper)`
  max-width: 870px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 480px;
  `};
`

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

export const FixedPreview = styled.div`
  position: relative;
  padding: 16px;
  width: 260px;
  height: fit-content;
  margin-top: 42px;
  background: ${({ theme }) => theme.bg0};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  position: sticky;
  top: 64px;
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.3' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
`

export const CurrencyDropdown = styled(CurrencyInputPanel)`
  width: 48.5%;
`

export const PreviewCard = styled(DarkGreyCard)<{ disabled?: boolean }>`
  padding: 8px;
  border-radius: 12px;
  min-height: 40px;
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.bg0};
  text-align: left;
  font-size: 18px;
  width: 100%;
`

export const ResponsiveTwoColumns = styled.div`
  display: grid;
  grid-gap: 32px;
  grid-template-columns: 1fr auto 1fr;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto;
  `};
`

export const Separator = styled.div`
  border: ${({ theme }) => `1px solid ${theme.bg3}`};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`

export const StackedContainer = styled.div`
  display: grid;
`

export const StackedItem = styled.div<{ zIndex?: number }>`
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex};
`
