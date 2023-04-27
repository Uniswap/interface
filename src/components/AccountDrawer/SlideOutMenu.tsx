import { ScrollBarStyles } from 'components/Common'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components/macro'
import { ClickableStyle, ThemedText } from 'theme'

const Menu = styled.div`
  width: 100%;
  overflow: auto;
  margin-top: 4px;
  padding: 14px 16px 16px;
  ${ScrollBarStyles}
  ::-webkit-scrollbar-track {
    margin-top: 40px;
  }
`

const Title = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`

const StyledArrow = styled(ArrowLeft)`
  ${ClickableStyle}
`

const Header = styled.div`
  color: ${({ theme }) => theme.textPrimary};

  display: flex;
  justify-content: space-between;
  position: relative;
  width: 100%;
  margin-bottom: 20px;
`

export const SlideOutMenu = ({
  children,
  onClose,
  title,
}: {
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  onClear?: () => void
}) => (
  <Menu>
    <Header>
      <StyledArrow data-testid="wallet-back" onClick={onClose} size={24} />
      <Title>
        <ThemedText.SubHeader>{title}</ThemedText.SubHeader>
      </Title>
    </Header>

    {children}
  </Menu>
)
