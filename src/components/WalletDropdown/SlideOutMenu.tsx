import { ChevronLeft } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'

const BackSection = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  text-align: center;
  padding-left: 16px;
  padding-right: 16px;
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
  return (
    <Menu>
      <BackSection>
        <ChevronLeft style={{ cursor: 'pointer' }} onClick={close} size={24} />
        <Text style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>{title}</Text>
        {clear && (
          <Text
            onClick={clear}
            marginLeft="auto"
            color={colors.blue400}
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
