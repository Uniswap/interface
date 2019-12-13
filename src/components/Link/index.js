import styled from 'styled-components'

export const Link = styled.a.attrs({
  target: '_blank',
  rel: 'noopener noreferrer'
})`
  text-decoration: underline;
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
