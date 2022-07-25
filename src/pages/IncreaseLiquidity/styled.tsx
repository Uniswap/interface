import { AutoColumn } from 'components/Column'
import styled from 'styled-components'

export const PageWrapper = styled.div`
  margin: 24px 12px;
`

export const Container = styled.div`
  text-align: center;
  width: calc(100% - 24px);
  margin: 24px auto 12px;
  max-width: 936px;
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);

  padding: 0 20px 28px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0 16px 24px;
  `};
`

export const GridColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  @media only screen and (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

export const FirstColumn = styled(AutoColumn)`
  grid-auto-rows: min-content;
  padding-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  gap: 20px;

  @media only screen and (min-width: 768px) {
    padding-right: 24px;
    padding-bottom: 0;
    border-right: 1px solid ${({ theme }) => theme.border};
    border-bottom: none;
  }
`

export const SecondColumn = styled(AutoColumn)`
  grid-auto-rows: min-content;
  padding-top: 24px;
  gap: 20px;

  @media only screen and (min-width: 768px) {
    padding-left: 24px;
    padding-top: 0;
  }
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
  margin: 1rem 0;
`
