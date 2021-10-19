import styled from 'styled-components'
import { Flex } from 'rebass'

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

export const GlobalDataContainer = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr;
  margin-bottom: 1rem;

  @media only screen and (min-width: 1000px) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export const GlobalDataItem = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px;
  border-radius: 5px;
  border: dashed 1px ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.advancedBG};
`

export const GlobalDataItemTitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text7};
`

export const GlobalDataItemValue = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.blue};
`

export const AddLiquidityInstructionContainer = styled.div`
  margin-bottom: 20px;
  padding: 1rem;
  background: ${({ theme }) => theme.bg17};
  border-radius: 8px;
`

export const AddLiquidityTitle = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.blue};
  margin-right: 0.5rem;
`

export const AddLiquidityInstructionText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text11};
`

export const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

export const CurrencyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;

  @media only screen and (min-width: 1000px) {
    flex-direction: row;
    margin-bottom: 0;
  }
`

export const SearchWrapper = styled(Flex)`
  align-items: center;
`

export const SelectPairInstructionWrapper = styled.div`
  text-align: center;
  height: 100%;
  padding: 24px;
`
