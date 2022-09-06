import { Text } from 'rebass'
import styled from 'styled-components'

export const Wrapper = styled.div`
  position: relative;
  padding: 1rem;
`

export const ClickableText = styled(Text)`
  :hover {
    cursor: pointer;
  }
  color: ${({ theme }) => theme.primary1};
`
export const MaxButton = styled.button<{ width: string }>`
  padding: .2rem .8rem;
  background-color: ${({ theme }) => theme.colorBlack05};
  border: 1px solid ${({ theme }) => theme.colorGray69};
  border-radius: 0.5rem;
  font-size: .4rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0.15rem 0.5rem;
  `};
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.4rem;
  overflow: hidden;
  color: ${({ theme }) => theme.colorWhiteCd};
  :hover {
    outline: none;
    background-color: ${({ theme }) => theme.colorGreen39};
    color: ${({ theme }) => theme.colorBlack00};
  }
  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.colorGreen39};
    color: ${({ theme }) => theme.colorBlack00};
  }
`

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
