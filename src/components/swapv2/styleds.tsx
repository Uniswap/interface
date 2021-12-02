import { transparentize } from 'polished'
import React, { useContext, useState } from 'react'
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
  z-index: 1;
  background: ${({ theme }) => theme.background};
`

export const AggregatorStatsContainer = styled.div`
  width: 100%;
  max-width: 425px;
  margin: auto;
  display: flex;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 24px;
    gap: 16px;
  `}
`

export const AggregatorStatsItem = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  background-color: ${({ theme }) => `${theme.buttonGray}33`};
`

export const AggregatorStatsItemTitle = styled.span`
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
`

export const AggregatorStatsItemValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  margin-left: 4px;
`

export const ArrowWrapper = styled.div<{ clickable: boolean; rotated?: boolean }>`
  padding: 2px;

  transform: rotate(${({ rotated }) => (rotated ? '180deg' : '0')});
  transition: transform 300ms;

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
  margin-top: 2.25rem;
`

export const ErrorText = styled(Text)<{ severity?: 0 | 1 | 2 | 3 | 4 }>`
  color: ${({ theme, severity }) =>
    severity === 3 || severity === 4
      ? theme.red1
      : severity === 2
      ? theme.yellow2
      : severity === 1
      ? theme.text
      : theme.green1};
`

export const StyledBalanceMaxMini = styled.button`
  height: 22px;
  width: 22px;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  padding: 0.2rem;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.25rem;
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

export function SwapCallbackError({ error }: { error: string }) {
  const theme = useContext(ThemeContext)
  const [showDetail, setShowDetail] = useState<boolean>(false)
  return (
    <SwapCallbackErrorInner>
      <Alert style={{ marginBottom: 'auto' }} />
      <AutoColumn style={{ flexBasis: '100%', margin: '10px 0 auto 8px' }}>
        <Text fontSize="16px" fontWeight="500" color={theme.red} lineHeight={'24px'}>
          {errorFriendly(error)}
        </Text>
        {error !== errorFriendly(error) && (
          <Text
            color={theme.primary}
            fontSize="12px"
            sx={{ cursor: `pointer` }}
            onClick={() => setShowDetail(!showDetail)}
          >
            Show more details
          </Text>
        )}
        {showDetail && (
          <Text color={theme.text} fontSize="10px" margin={'10px 0 4px 0'} lineHeight={'16px'}>
            {error}
          </Text>
        )}
      </AutoColumn>
    </SwapCallbackErrorInner>
  )
}

export const SwapShowAcceptChanges = styled(AutoColumn)`
  background-color: ${({ theme }) => transparentize(0.9, theme.primary)};
  color: ${({ theme }) => theme.primary};
  padding: 0.5rem;
  border-radius: 12px;
  margin-top: 8px;
`

export const GroupButtonReturnTypes = styled.div`
  display: flex;
  margin-top: 28px;
  border-radius: 999px;
  background: ${({ theme }) => theme.buttonBlack};
`

export const ButtonReturnType = styled.div<{ active?: boolean }>`
  border-radius: 999px;
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.primary : theme.buttonBlack)};
  color: ${({ theme, active }) => (active ? theme.textReverse : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
`

export const SwapFormActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

export const KyberTag = styled.div`
  position: absolute;
  display: flex;
  top: 28px;
  left: 6px;
  font-weight: 500;
  border-bottom-right-radius: 0.25rem;
  border-top-left-radius: 0.25rem;
  background: ${({ theme }) => `${theme.primary}33`};
  padding: 0.375rem;
  color: ${({ theme }) => theme.primary};
  font-size: 0.75rem;
  z-index: 2;
`

export const PriceImpactHigh = styled.div<{ veryHigh?: boolean }>`
  border-radius: 4px;
  padding 12px 16px;
  background: ${({ theme, veryHigh }) => (veryHigh ? `${theme.red}66` : `${theme.warning}66`)};
  margin-top: 28px;
  display: flex;
  align-items: center;
  font-size: 12px;
`
