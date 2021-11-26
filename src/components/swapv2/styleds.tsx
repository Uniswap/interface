import { transparentize } from 'polished'
import React, { useContext, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { ThemeContext, css } from 'styled-components'
import { Text } from 'rebass'
import { AutoColumn } from '../Column'
import { errorFriendly } from 'utils/dmm'
import { ReactComponent as Alert } from '../../assets/images/alert.svg'

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  padding: 0 16px 100px;

  @media only screen and (min-width: 768px) {
    flex-direction: column;
    padding: 24px 16px 100px;
  }

  @media only screen and (min-width: 1000px) {
    gap: 4px;
    padding: 24px 32px 100px;
  }

  @media only screen and (min-width: 1366px) {
    padding: 24px 215px 50px;
  }

  @media only screen and (min-width: 1440px) {
    padding: 24px 252px 50px;
  }
`

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  gap: 28px;

  @media only screen and (min-width: 1000px) {
    flex-direction: row;
    align-items: flex-start;
    gap: 24px;
  }

  & > div:first-child {
    width: 100%;
    max-width: 425px;
  }
`

export const Wrapper = styled.div`
  position: relative;
`

export const AggregatorStatsContainer = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1fr;
  margin-top: 36px;

  @media only screen and (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    margin-top: 0;
    grid-gap: 1.5rem;
  }
`

export const AggregatorStatsItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  background-color: ${({ theme }) => `${theme.buttonGray}66`};
`

export const AggregatorStatsItemTitle = styled.span`
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
`

export const AggregatorStatsItemValue = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.blue};
  margin-left: 4px;
`

export const ArrowWrapper = styled.div<{ clickable: boolean }>`
  padding: 2px;

  ${({ clickable }) =>
    clickable
      ? css`
          :hover {
            cursor: pointer;
            opacity: 0.8;
          }
        `
      : null}
`

export const SectionBreak = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg3};
`

export const BottomGrouping = styled.div`
  margin-top: 1rem;
`

export const ErrorText = styled(Text)<{ severity?: 0 | 1 | 2 | 3 | 4 }>`
  color: ${({ theme, severity }) =>
    severity === 3 || severity === 4
      ? theme.red1
      : severity === 2
      ? theme.yellow2
      : severity === 1
      ? theme.text1
      : theme.green1};
`

export const StyledBalanceMaxMini = styled.button`
  height: 22px;
  width: 22px;
  background-color: ${({ theme }) => theme.bg2};
  border: none;
  border-radius: 50%;
  padding: 0.2rem;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.4rem;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};
  display: flex;
  justify-content: center;
  align-items: center;
  float: right;

  :hover {
    background-color: ${({ theme }) => theme.bg3};
  }
  :focus {
    background-color: ${({ theme }) => theme.bg3};
    outline: none;
  }
`

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  width: 220px;
  overflow: hidden;
`

// styles
export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`

const SwapCallbackErrorInner = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.red1)};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.825rem;
  width: 100%;
  margin-top: 36px;
  padding: 8px 20px 8px 8px;
  background-color: ${({ theme }) => `${theme.bg12}66`};
  z-index: -1;
  p {
    padding: 0;
    margin: 0;
    font-weight: 500;
  }
`

const SwapCallbackErrorInnerAlertTriangle = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.red1)};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  border-radius: 12px;
  min-width: 48px;
  height: 48px;
`

export function SwapCallbackError({ error }: { error: string }) {
  const theme = useContext(ThemeContext)
  const [showDetail, setShowDetail] = useState<boolean>(false)
  return (
    <SwapCallbackErrorInner>
      <Alert style={{ marginBottom: 'auto' }} />
      <AutoColumn style={{ flexBasis: '100%', margin: '10px 0 auto 8px' }}>
        <Text fontSize="16px" fontWeight="500" color={theme.red}>
          {errorFriendly(error)}
        </Text>
        <Text
          color={theme.primary1}
          fontSize="12px"
          sx={{ cursor: `pointer` }}
          onClick={() => setShowDetail(!showDetail)}
        >
          Show more details
        </Text>
        {showDetail && (
          <Text color={theme.text1} fontSize="10px" style={{ margin: '10px 0 4px 0' }}>
            {error}
          </Text>
        )}
      </AutoColumn>
    </SwapCallbackErrorInner>
  )
}

export const SwapShowAcceptChanges = styled(AutoColumn)`
  background-color: ${({ theme }) => transparentize(0.9, theme.primary1)};
  color: ${({ theme }) => theme.primary1};
  padding: 0.5rem;
  border-radius: 12px;
  margin-top: 8px;
`

export const GroupButtonReturnTypes = styled.div`
  display: flex;
  margin-bottom: 12px;
  .button-return-type {
    align-items: center;
    flex: 1;
    height: 32px;
    padding: 7px;
    line-height: 14px;
    font-size: 14px;
    border-radius: 0;
    cursor: pointer;
    &:first-child {
      border-top-left-radius: 20px;
      border-bottom-left-radius: 20px;
    }
    &:last-child {
      border-top-right-radius: 20px;
      border-bottom-right-radius: 20px;
    }
    &.button-active {
      color: ${({ theme }) => theme.text1};
      background-color: ${({ theme }) => theme.bg12};
    }
    svg {
      margin-right: 4px;
    }
  }
`

export const SwapFormActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

export const KyberDmmOutput = styled.div`
  border-radius: 0.25rem;
  background-color: ${({ theme }) => `${theme.primary1}33`};
  position: relative;
  overflow: hidden;
  padding: 0.875rem 0.75rem;
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: end;
`

export const CompareDexOuput = styled(KyberDmmOutput)`
  background-color: ${({ theme }) => theme.buttonGray}40;
`

export const KyberTag = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  font-weight: 500;
  border-bottom-right-radius: 0.25rem;
  background: ${({ theme }) => theme.primary1};
  padding: 0.125rem 0.5rem;
  color: #fff;
  font-size: 0.75rem;
`
