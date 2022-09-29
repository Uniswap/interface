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
export const MaxButton = styled.button.attrs((props) => {
  return {
    ...props,
    className: Array.isArray(props.className)
      ? [...props.className, 'text-detail']
      : props.className
      ? [props.className, 'text-detail']
      : ['text-detail']
  }
})<{ width: string }>`
  padding: 0.2rem 0.8rem;
  background-color: rgba(255, 255, 255, 0.1);
  // border: 1px solid ${({ theme }) => theme.common3};
  border: 0;
  border-radius: 0.5rem;
  font-weight: 200;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0.15rem 0.5rem;
  `};
  cursor: pointer;
  margin-right: 0.4rem;
  overflow: hidden;
  color: ${({ theme }) => theme.common3};
  :hover {
    color: #39e1ba;
    outline: none;
    // background-color: ${({ theme }) => theme.primary1};
  }
  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.primary1};
    color: ${({ theme }) => theme.common1};
    font-weight: 400;
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
