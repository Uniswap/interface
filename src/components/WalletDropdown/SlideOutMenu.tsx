import { ChevronLeft } from 'react-feather'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components/macro'

const BackSection = styled.div`
  position: relative;
  display: flex;
  padding: 0 16px;
  color: ${({ theme }) => theme.textTertiary};
  cursor: default;
  :hover {
    text-decoration: none;
  }
`

const Menu = styled.div`
  width: 100%;
  height: 100%;
  font-size: 16px;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
`

export const SlideOutMenu = ({
  children,
  close,
  title,
  clear,
}: {
  close: () => void
  title: JSX.Element
  children: JSX.Element | Array<JSX.Element>
  clear?: () => void
}) => {
  const theme = useTheme()

  return (
    <Menu>
      <BackSection>
        <ChevronLeft style={{ cursor: 'pointer' }} onClick={close} size={24} />
        <Text style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          {title}
        </Text>
        {clear && (
          <Text
            onClick={clear}
            marginLeft="auto"
            color={theme.accentAction}
            fontWeight={600}
            fontSize={14}
            style={{ cursor: 'pointer' }}
          >
            Clear All
          </Text>
        )}
      </BackSection>
      {children}
    </Menu>
  )
}
