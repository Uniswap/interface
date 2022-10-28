import 'react-loading-skeleton/dist/skeleton.css'

import styled, { keyframes } from 'styled-components/macro'

import { CardWrapper } from 'pages/Swap'
import Skeleton from 'react-loading-skeleton'
import { Text } from 'rebass'
import done from './done.json'
import useTheme from 'hooks/useTheme'
import { darken } from 'polished'

export const Wrapper = styled.div`
  position: relative;
  padding: 20px;
`

export const ClickableText = styled(Text)`
  :hover {
    cursor: pointer;
  }
  color: ${({ theme }) => theme.primary1};
`
export const MaxButton = styled.button<{ width: string }>`
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.primary5};
  border-radius: 0.5rem;
  font-size: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0.25rem 0.5rem;
  `};
  font-weight: 500;
  cursor: pointer;
  margin: 0.25rem;
  overflow: hidden;
  color: ${({ theme }) => theme.primary1};
  :hover {
    outline: none;
    background: ${({ theme }) => darken(0.1, theme.primary5)};
  }
`



const Loading = ({ count }: any) => {
  const theme = useTheme()
  return (
    <Skeleton wrapper={({ children }: any) => <Wrapper style={{ padding: 15 }}>{children}</Wrapper>} height={30} enableAnimation baseColor={theme.bg1} highlightColor="#444" count={count} />
  )
}

type LoadingSkelProps = {
  count: number;
  borderRadius?: number
}
export const LoadingSkeleton = (props: LoadingSkelProps) => (
  <Loading count={props.count} borderRadius={props.borderRadius ? props.borderRadius : 10} />
)
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

const loadingAnimation = keyframes`
  0% {
    background-position: 100% 50%;
    opacity:0.8;
  }
  100% {
    background-position: 0% 50%;
    opacity:0.5;
  }
`

export const LoadingRows = styled.div`
  display: grid;
  min-width: 75%;
  max-width: 960px;
  grid-column-gap: 0.5em;
  grid-row-gap: 0.8em;
  grid-template-columns: repeat(3, 1fr);
  & > div {
    animation: ${loadingAnimation} 1.5s infinite;
    animation-fill-mode: both;
    background: ${({ theme }) => theme.bg0};
    opacity:0.8;
    background-size: 400%;
    border-radius: 12px;
    height: 2.4em;
    will-change: background-position;
  }
  & > div:nth-child(4n + 1) {
    grid-column: 1 / 3;
  }
  & > div:nth-child(4n) {
    grid-column: 3 / 4;
    margin-bottom: 2em;
  }
`