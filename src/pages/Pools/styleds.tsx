import styled from 'styled-components'
import { Flex } from 'rebass'

export const PoolsPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 16px 100px;
  width: 100%;

  @media only screen and (min-width: 768px) {
    padding: 32px 64px 100px;
  }

  @media only screen and (min-width: 1700px) {
    padding: 32px 252px 50px;
  }
`

export const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
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
