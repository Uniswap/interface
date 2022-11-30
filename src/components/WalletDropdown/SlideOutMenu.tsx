import { ScrollBarStyles } from 'components/Common'
import { ChevronLeft } from 'react-feather'
import styled from 'styled-components/macro'

const Menu = styled.div`
  width: 100%;
  height: 100%;
  font-size: 16px;
  overflow: auto;
  max-height: 450px;

  ${ScrollBarStyles}

  ::-webkit-scrollbar-track {
    margin-top: 40px;
  }
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
    opacity: ${({ theme }) => theme.opacity.hover};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} opacity ${timing.in}`};
  }
`

const StyledChevron = styled(ChevronLeft)`
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.textPrimary};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} color ${timing.in}`};
  }
`

const BackSection = styled.div`
  position: absolute;
  background-color: ${({ theme }) => theme.backgroundSurface};
  width: 99%;
  padding: 0 16px 16px 16px;
  color: ${({ theme }) => theme.textSecondary};
  cursor: default;
  display: flex;
  justify-content: space-between;
  z-index: 1;
`

const BackSectionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  width: 100%;
`

const ChildrenContainer = styled.div`
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
        <StyledChevron data-testid="wallet-back" onClick={onClose} size={24} />
        <Header data-testid="wallet-header">{title}</Header>
        {onClear && <ClearAll onClick={onClear}>Clear All</ClearAll>}
      </BackSectionContainer>
    </BackSection>

    <ChildrenContainer>{children}</ChildrenContainer>
  </Menu>
)
