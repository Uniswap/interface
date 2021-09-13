import styled from 'styled-components'
import border8pxRadius from '../../assets/images/border-8px-radius.png'

export const Option = styled.button<{ active?: boolean; width?: string; transparent?: boolean }>`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2rem;
  border-radius: 8px;
  font-size: 15px;
  line-height: 18px;
  width: auto;
  min-width: 3.5rem;
  border: ${({ transparent }) => (transparent ? 'none' : '8px solid')};
  border-radius: 8px;
  border-image: ${({ transparent }) => (transparent ? 'none' : `url(${border8pxRadius}) 8`)};
  outline: none;
  margin-right: 8px;
  cursor: pointer;
  border: none;
  background-color: ${({ active, theme, transparent }) => {
  if (transparent) {
    return 'transparent'
  }
  return active ? theme.primary1 : theme.bg2
}};
  color: ${({ theme }) => theme.white};
`