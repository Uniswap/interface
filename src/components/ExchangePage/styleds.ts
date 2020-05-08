import styled from 'styled-components'
import { AutoColumn } from '../Column'
import { Text } from 'rebass'

import NumericalInput from '../NumericalInput'

export const Wrapper = styled.div`
  position: relative;
`

export const ArrowWrapper = styled.div`
  padding: 2px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;

  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

export const FixedBottom = styled.div`
  position: absolute;
  margin-top: 1.5rem;
  width: 100%;
  margin-bottom: 40px;
`

export const AdvancedDropwdown = styled.div`
  position: absolute;
  margin-top: -12px;
  max-width: 455px;
  width: 100%;
  margin-bottom: 100px;
  padding: 10px 0;
  padding-top: 36px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: ${({ theme }) => theme.text2};
  background-color: ${({ theme }) => theme.advancedBG};
  color: ${({ theme }) => theme.text2};
  z-index: -1;
`

export const SectionBreak = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg3};
`

export const BottomGrouping = styled.div`
  margin-top: 12px;
  position: relative;
`

export const ErrorText = styled(Text)<{ warningLow?: boolean; warningMedium?: boolean; warningHigh?: boolean }>`
  color: ${({ theme, warningLow, warningMedium, warningHigh }) =>
    warningHigh ? theme.red1 : warningMedium ? theme.yellow2 : warningLow ? theme.green1 : theme.text1};
`

export const InputGroup = styled(AutoColumn)`
  position: relative;
  padding: 40px 0 20px 0;
`

export const StyledNumerical = styled(NumericalInput)`
  text-align: center;
  font-size: 48px;
  font-weight: 500px;
  width: 100%;

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

export const MaxButton = styled.button`
  position: absolute;
  right: 70px;
  padding: 0.5rem 0.5rem;
  background-color: ${({ theme }) => theme.blue5};
  border: 1px solid ${({ theme }) => theme.blue5};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.blue1};
  :hover {
    border: 1px solid ${({ theme }) => theme.blue1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.blue1};
    outline: none;
  }
`

export const StyledBalanceMaxMini = styled.button<{ active?: boolean }>`
  height: 24px;
  background-color: ${({ theme }) => theme.bg2};
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  float: right;

  :hover {
    background-color: ${({ theme }) => theme.bg3};

    /* border: 1px solid ${({ theme, active }) => (active ? theme.bg2 : theme.blue4)}; */
  }
  :focus {
    background-color: ${({ theme }) => theme.bg3};
    /* border: 1px solid ${({ theme, active }) => (active ? theme.bg2 : theme.blue4)}; */
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
