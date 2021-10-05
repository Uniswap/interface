import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import Card from 'components/Card'
import NumericalInput from 'components/NumericalInput'

export const PageWrapper = styled.div`
  padding: 12px 16px 100px;
  width: 100%;

  @media only screen and (min-width: 768px) {
    padding: 16px 16px 100px;
  }

  @media only screen and (min-width: 1000px) {
    padding: 16px 32px 100px;
  }

  @media only screen and (min-width: 1366px) {
    padding: 16px 215px 50px;
  }

  @media only screen and (min-width: 1440px) {
    padding: 16px 252px 50px;
  }
`

export const Container = styled.div`
  max-width: 936px;
  margin: 0 auto;
  padding: 24px 20px;
  background: ${({ theme }) => theme.bg6};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 8px;

  @media only screen and (min-width: 1000px) {
    padding: 24px;
  }
`

export const GridColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  @media only screen and (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

export const TokenColumn = styled(AutoColumn)`
  padding-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border4};

  @media only screen and (min-width: 768px) {
    padding-right: 24px;
    padding-bottom: 0;
    border-right: 1px solid ${({ theme }) => theme.border4};
    border-bottom: none;
  }
`

export const AMPColumn = styled(AutoColumn)`
  padding-top: 24px;

  @media only screen and (min-width: 768px) {
    padding-left: 24px;
    padding-top: 0;
  }
`

export const ActiveText = styled.div`
  font-weight: 500;
  font-size: 16px;
`

export const Section = styled(Card)`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border4};
  border-radius: 8px;
`

export const NumericalInput2 = styled(NumericalInput)`
  width: 100%;
  height: 60px;
`

export const USDPrice = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  padding-left: 8px;
  color: ${({ theme }) => theme.primaryText2};
`

export const Warning = styled.div`
  display: flex;
  background: ${({ theme }) => `${theme.warning}20`};
  border-radius: 0.625rem;
  padding: 0.75rem 1rem;
`
