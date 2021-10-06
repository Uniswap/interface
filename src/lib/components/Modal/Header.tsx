import { Icon } from 'react-feather'

import themed from '../../themed'
import { ThemedButton } from '../../themed/components'

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

export interface HeaderProps {
  title: string
  Icon?: Icon
  onClick?: () => void
}

export default function Header({ title, Icon, onClick }: HeaderProps) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      {Icon && (
        <ThemedButton onClick={onClick}>
          <Icon />
        </ThemedButton>
      )}
    </Wrapper>
  )
}
