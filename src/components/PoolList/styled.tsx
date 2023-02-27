import { Flex } from 'rebass'
import styled from 'styled-components'

export const TableRow = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
  padding: 12px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};

  :last-child {
    border-bottom: none;
    border-bottom-right-radius: 20px;
    border-bottom-left-radius: 20px;
  }
`

export const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

export const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
  align-items: center;
`

export const AMPLiquidityAndTVLContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`

export const TextTVL = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

export const TokenRatioContainer = styled.div`
  background: ${({ theme }) => theme.background};
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  padding: 4px;
  overflow: hidden;
  margin-top: 1rem;
`

export const TokenRatioGrid = styled.div`
  padding: 4px;
  display: grid;
  grid-template-columns: auto 1fr 1fr auto;
  grid-template-rows: 1fr;
  gap: 8px;
  isolation: isolate;
`

export const ProgressWrapper = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  bottom: 2px;
  width: calc(100% - 4px);
  border-top-left-radius: 999px;
  border-bottom-left-radius: 999px;
  overflow: hidden;
`
export const Progress = styled.div<{ value: string }>`
  height: 44px;
  width: ${({ value }) => value + '%'};
  background: ${({ theme }) => theme.buttonBlack};
`

export const TokenRatioName = styled.div`
  font-size: 14px;
  font-weight: 500;
`

export const TokenRatioPercent = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

export const TabContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.tabBackgound};
  border-radius: 20px;
  display: flex;
  padding: 2px;
  cursor: pointer;
`

export const TabItem = styled.div<{ active?: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  background: ${({ theme, active }) => (active ? theme.tabActive : 'transparent')};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px;
  border-radius: 20px;
  flex-grow: 1;
  flex-basis: 0;
  transition: color 300ms;
`
