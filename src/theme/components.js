import styled from 'styled-components'
import { lighten, darken } from 'polished'

export const Button = styled.button`
  font-size: 1rem;
  padding: 1rem 2rem 1rem 2rem;
  background-color: ${({ theme }) => theme.royalBlue};
  cursor: pointer;
  border-radius: 3rem;
  color: ${({ theme }) => theme.white};
  outline: none;
  border: none;
  user-select: none;
  transition: background-color 125ms ease-in-out;

  :hover {
    background-color: ${({ theme }) => lighten(0.05, theme.royalBlue)};
  }

  :active {
    background-color: ${({ theme }) => darken(0.05, theme.royalBlue)};
  }

  :disabled {
    background-color: ${({ theme }) => theme.mercuryGray};
    cursor: auto;
  }
`
