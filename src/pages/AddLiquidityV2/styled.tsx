import { AutoColumn } from 'components/Column'
import Input from 'components/NumericalInput'
import styled from 'styled-components'
import { Flex } from 'rebass'
export const PageWrapper = styled.div`
  margin: 64px 12px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 24px 12px;
  `};
`
export const Container = styled.div`
  max-width: 880px;
  width: 100%;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.background};

  padding: 4px 20px 28px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 480px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0 16px 24px;
  `};
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
`

export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.buttonBlack};
  text-align: left;
  font-size: 24px;
  width: 100%;
`

/* two-column layout where DepositAmount is moved at the very end on mobile. */
export const ResponsiveTwoColumns = styled.div`
  margin-top: 6px;
  display: grid;
  grid-row-gap: 24px;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: max-content;
  grid-auto-flow: row;

  padding-top: 20px;

  border-top: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
  `};
`

export const RightContainer = styled(AutoColumn)`
  grid-row: 1 / 3;
  grid-column: 2;
  height: fit-content;

  padding-left: 24px;
  border-left: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-row: 2 / 3;
    grid-column: 1;
    border-left: none;
    padding-left: 0px;
  `};
`

export const FlexLeft = styled(Flex)`
  flex-direction: column;
  gap: 24px;
  padding-right: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-right: 0px;
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

export const MediumOnly = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `};
`

export const HideMedium = styled.div`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: block;
  `};
`
