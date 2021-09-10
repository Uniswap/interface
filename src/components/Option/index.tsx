import styled from 'styled-components'
import { Colors } from '../../theme/styled'



export const Option = styled.button<{
  active?: boolean
  width?: string
  transparent?: boolean
  backgroundColor?: keyof Colors
  disabled?:boolean
}>`
  display:flex;
  color: ${({ theme }) => theme.text1};
  align-items: center;
  font-size: 15px;
  line-height: 19.5px;
  width: auto;
  min-width: 3.5rem;
  border: ${({ transparent }) => (transparent ? 'none' : '8px solid')};
  border-radius: 12px;
  padding: 6px 10px;
  outline: none;
  margin-right: 8px;
 filter: ${({ disabled }) => disabled && 'grayscale(1)'};
  cursor:${({ disabled }) => (!disabled && 'pointer')}; ;
  border: none;
  background-color: ${({ active, theme, transparent, backgroundColor }) => {
    if (transparent) {
      return 'transparent'
    }
    return active ? theme.primary1 : backgroundColor ? theme[backgroundColor]: theme.bg2
  }};
  color: ${({ theme }) => theme.white};
   :hover {
   
    background-color: ${({ theme, disabled }) => !disabled && theme.bg2};
  }
`
