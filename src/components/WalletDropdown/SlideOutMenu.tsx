import { ChevronLeft } from 'react-feather'
import styled from 'styled-components/macro'

const BackSection = styled.div`
  position: relative;
  display: flex;
  padding: 0 16px;
  color: ${({ theme }) => theme.textSecondary};
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
`

const Header = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 200px;
`

const ClearAll = styled.div`
  display: inline-block;
  cursor: pointer;
  margin-left: auto;
  color: ${({ theme }) => theme.accentAction};
  font-weight: 600;
  font-size: 14px;
  margin-top: auto;
  margin-bottom: auto;
`

export const SlideOutMenu = ({
  children,
  onClose,
  title,
  onClear,
}: {
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  onClear?: () => void
}) => (
  <Menu>
    <BackSection>
      <ChevronLeft cursor="pointer" onClick={onClose} size={24} />

      <Header>{title}</Header>
      {onClear && <ClearAll onClick={onClear}>Clear All</ClearAll>}
    </BackSection>
    {children}
  </Menu>
)
