import { ChevronLeft } from 'react-feather'
import styled from 'styled-components/macro'

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
`

const ClearAll = styled.div`
  display: inline-block;
  cursor: pointer;
  color: ${({ theme }) => theme.accentAction};
  font-weight: 600;
  font-size: 14px;
  margin-top: auto;
  margin-bottom: auto;

  :hover {
    opacity: 0.6;
    ${({ theme }) => theme.transitions};
  }
`

const StyledChevron = styled(ChevronLeft)`
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
    ${({ theme }) => theme.transitions};
  }
`

const BackSection = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.backgroundSurface};
  width: 100%;
  display: flex;
  padding: 0 16px 16px 16px;
  color: ${({ theme }) => theme.textSecondary};
  cursor: default;
  text-decoration: none;
`

const BackSectionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  width: 100%;
`

const ChildComponentsWrap = styled.div`
  margin-top: 40px;
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
      <BackSectionContainer>
        <StyledChevron onClick={onClose} size={24} />
        <Header>{title}</Header>
        {onClear && <ClearAll onClick={onClear}>Clear All</ClearAll>}
      </BackSectionContainer>
    </BackSection>

    <ChildComponentsWrap>{children}</ChildComponentsWrap>
  </Menu>
)
