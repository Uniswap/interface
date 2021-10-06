import { Icon } from 'react-feather'

import themed from '../../themed'

const Wrapper = themed.div`
  display: flex;
  height: 24px;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 8px;
`

const Title = themed.div`
  display: flex;
  color: ${({ theme }) => theme.text1};
`

const ThemedButton = themed.button`
  border: none;
  background-color: transparent;
  padding: 0;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    opacity: 0.7;
  }
`

export interface HeaderProps {
  title: string
  Icon?: Icon
  onClick?: () => void
}

export default function Header({ title, Icon, onClick }: HeaderProps) {
  const ThemedIcon = themed(Icon)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.icon1};
  }
  `

  return (
    <Wrapper>
      <Title>{title}</Title>
      <ThemedButton onClick={onClick}>
        <ThemedIcon />
      </ThemedButton>
    </Wrapper>
  )
}
