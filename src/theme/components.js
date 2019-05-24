import styled from 'styled-components'
import { lighten, darken } from 'polished'

export const Button = styled.button`
  padding: 1rem 2rem 1rem 2rem;
  border-radius: 3rem;
  cursor: pointer;
  user-select: none;
  font-size: 1rem;
  border: none;
  outline: none;
  background-color: ${({ theme }) => theme.royalBlue};
  color: ${({ theme }) => theme.white};
  transition: background-color 125ms ease-in-out;
  width: 100%;

  :hover,
  :focus {
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

export const Link = styled.a.attrs({
  target: '_blank',
  rel: 'noopener noreferrer'
})`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.royalBlue};

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }
`

export const BorderlessInput = styled.input`
  color: ${({ theme }) => theme.mineshaftGray};
  font-size: 1rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.mercuryGray};
  }
`
