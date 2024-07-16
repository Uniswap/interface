import Column from 'components/Column'
import Row from 'components/Row'
import { StyledImage } from 'nft/components/card/media'
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'

const BORDER_RADIUS = '12'

const StyledDetailsRelativeContainer = styled.div`
  position: relative;
  height: 84px;
`

const StyledDetailsContainer = styled(Column)`
  position: absolute;
  width: 100%;
  padding: 16px 8px 0px;
  justify-content: space-between;
  gap: 8px;
  height: 84px;
  background: ${({ theme }) => theme.surface1};
  will-change: transform;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} transform`};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    height: 112px;
    transform: translateY(-28px);
  }
`

const StyledActionButton = styled(ThemedText.BodySmall)<{
  selected: boolean
  isDisabled: boolean
}>`
  position: absolute;
  display: flex;
  padding: 8px 0px;
  bottom: -32px;
  left: 8px;
  right: 8px;
  color: ${({ theme, isDisabled }) => (isDisabled ? theme.neutral1 : theme.deprecated_accentTextLightPrimary)};
  background: ${({ theme, selected, isDisabled }) =>
    selected ? theme.critical : isDisabled ? theme.surface3 : theme.accent1};
  transition: ${({ theme }) =>
    `${theme.transition.duration.medium} ${theme.transition.timing.ease} bottom, ${theme.transition.duration.medium} ${theme.transition.timing.ease} visibility`};
  will-change: transform;
  border-radius: 8px;
  justify-content: center;
  font-weight: 535 !important;
  line-height: 16px;
  visibility: hidden;
  cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    visibility: visible;
    bottom: 8px;
  }

  &:before {
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    content: '';
  }

  &:hover:before {
    background-color: ${({ theme, isDisabled }) => !isDisabled && theme.deprecated_stateOverlayHover};
  }

  &:active:before {
    background-color: ${({ theme, isDisabled }) => !isDisabled && theme.deprecated_stateOverlayPressed};
  }
`

const ActionButton = ({
  isDisabled,
  isSelected,
  clickActionButton,
  children,
}: {
  isDisabled: boolean
  isSelected: boolean
  clickActionButton: (e: React.MouseEvent) => void
  children: ReactNode
}) => {
  return (
    <StyledActionButton
      selected={isSelected}
      isDisabled={isDisabled}
      onClick={(e) => (isDisabled ? undefined : clickActionButton(e))}
    >
      {children}
    </StyledActionButton>
  )
}

const StyledCardContainer = styled.div<{ selected: boolean; isDisabled: boolean }>`
  position: relative;
  border-radius: ${BORDER_RADIUS}px;
  background-color: ${({ theme }) => theme.surface1};
  overflow: hidden;
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  isolation: isolate;

  :after {
    content: '';
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    border: ${({ selected }) => (selected ? '3px' : '1px')} solid;
    border-radius: ${BORDER_RADIUS}px;
    border-color: ${({ theme, selected }) => (selected ? theme.accent1 : theme.surface3)};
    pointer-events: none;
    transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} border`};
    will-change: border;

    @media screen and (max-width: ${BREAKPOINTS.sm}px) {
      ${({ selected, theme }) => selected && `border-color: ${theme.critical}`};
    }
  }

  :hover::after {
    ${({ selected, theme }) => selected && `border-color: ${theme.critical}`};
  }

  :hover {
    ${StyledActionButton} {
      visibility: visible;
      bottom: 8px;
    }

    ${StyledDetailsContainer} {
      height: 112px;
      transform: translateY(-28px);
    }

    ${StyledImage} {
      transform: scale(1.15);
    }
  }
`

const CardContainer = ({
  isSelected,
  isDisabled,
  children,
  testId,
  onClick,
}: {
  isSelected: boolean
  isDisabled: boolean
  children: ReactNode
  testId?: string
  onClick?: (e: React.MouseEvent) => void
}) => {
  return (
    <StyledCardContainer
      selected={isSelected}
      isDisabled={isDisabled}
      draggable={false}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </StyledCardContainer>
  )
}

const StyledLink = styled(Link)`
  text-decoration: none;
`

const Container = ({
  isSelected,
  isDisabled,
  detailsHref,
  testId,
  onClick,
  children,
}: {
  isSelected: boolean
  isDisabled: boolean
  detailsHref?: string
  testId?: string
  children: ReactNode
  onClick?: (e: React.MouseEvent) => void
}) => {
  return (
    <CardContainer isSelected={isSelected} isDisabled={isDisabled} testId={testId} onClick={onClick}>
      {detailsHref ? <StyledLink to={detailsHref}>{children}</StyledLink> : children}
    </CardContainer>
  )
}

const DetailsRelativeContainer = ({ children }: { children: ReactNode }) => {
  return <StyledDetailsRelativeContainer>{children}</StyledDetailsRelativeContainer>
}

const DetailsContainer = ({ children }: { children: ReactNode }) => {
  return <StyledDetailsContainer>{children}</StyledDetailsContainer>
}

const StyledInfoContainer = styled(Column)`
  gap: 4px;
  overflow: hidden;
  width: 100%;
  padding: 0px 8px;
  height: 48px;
`

const InfoContainer = ({ children }: { children: ReactNode }) => {
  return <StyledInfoContainer>{children}</StyledInfoContainer>
}

const StyledPrimaryRow = styled(Row)`
  gap: 8px;
  justify-content: space-between;
`

const PrimaryRow = ({ children }: { children: ReactNode }) => <StyledPrimaryRow>{children}</StyledPrimaryRow>

const StyledPrimaryDetails = styled(Row)`
  justify-items: center;
  overflow: hidden;
  white-space: nowrap;
  gap: 8px;
`

const PrimaryDetails = ({ children }: { children: ReactNode }) => (
  <StyledPrimaryDetails>{children}</StyledPrimaryDetails>
)

const PrimaryInfoContainer = styled(ThemedText.BodySmall)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 535 !important;
  line-height: 20px;
`

const PrimaryInfo = ({ children }: { children: ReactNode }) => {
  return <PrimaryInfoContainer>{children}</PrimaryInfoContainer>
}

const StyledSecondaryRow = styled(Row)`
  justify-content: space-between;
`

const SecondaryRow = ({ children }: { children: ReactNode }) => <StyledSecondaryRow>{children}</StyledSecondaryRow>

const StyledSecondaryDetails = styled(Row)`
  overflow: hidden;
  white-space: nowrap;
`

const SecondaryDetails = ({ children }: { children: ReactNode }) => (
  <StyledSecondaryDetails>{children}</StyledSecondaryDetails>
)

const SecondaryInfoContainer = styled(ThemedText.BodyPrimary)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 24px;
`

const SecondaryInfo = ({ children }: { children: ReactNode }) => {
  return <SecondaryInfoContainer>{children}</SecondaryInfoContainer>
}

export {
  ActionButton,
  Container,
  DetailsContainer,
  DetailsRelativeContainer,
  InfoContainer,
  PrimaryDetails,
  PrimaryInfo,
  PrimaryRow,
  SecondaryDetails,
  SecondaryInfo,
  SecondaryRow,
}
