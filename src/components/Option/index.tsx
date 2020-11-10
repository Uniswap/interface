import styled from 'styled-components'
import border8pxRadius from '../../assets/images/border-8px-radius.png'

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2rem;
  border-radius: 8px;
  font-size: 15px;
  line-height: 18px;
  width: auto;
  min-width: 3.5rem;
  border: 8px solid;
  border-radius: 8px;
  border-image: url(${border8pxRadius}) 8;
  background: ${({ theme }) => theme.bg2};
  outline: none;
`

export const Option = styled(FancyButton)<{ active?: boolean; width?: string }>`
  margin-right: 8px;
  cursor: pointer;
  border: none;
  background-color: ${({ active, theme }) => (active ? theme.primary1 : theme.bg2)};
  color: ${({ theme }) => theme.white};
`
