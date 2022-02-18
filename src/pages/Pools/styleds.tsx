import styled from 'styled-components'
import { Flex } from 'rebass'

export const PageWrapper = styled.div`
  padding: 24px 32px 50px;
  width: 100%;
  max-width: 1250px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 24px 16px 50px;
  `}
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
