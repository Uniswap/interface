import React, { useState } from 'react'
import styled, { css } from 'styled-components'
import { transparentize } from 'polished'
import ReactGA from 'react-ga'
import { ReactComponent as Dropup } from '../../assets/images/dropup-blue.svg'
import { ReactComponent as Dropdown } from '../../assets/images/dropdown-blue.svg'

const SummaryWrapper = styled.div`
  color: ${({ error, brokenTokenWarning, theme }) => (error || brokenTokenWarning ? theme.salmonRed : theme.doveGray)};
  font-size: 0.75rem;
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
`

const SummaryWrapperContainer = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.royalBlue};
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  img {
    height: 0.75rem;
    width: 0.75rem;
  }
`

const Details = styled.div`
  background-color: ${({ theme }) => theme.concreteGray};
  /* padding: 1.25rem 1.25rem 1rem 1.25rem; */
  border-radius: 1rem;
  font-size: 0.75rem;
  margin: 1rem 0.5rem 0 0.5rem;
`

const ErrorSpan = styled.span`
  margin-right: 12px;
  font-size: 0.75rem;
  line-height: 0.75rem;

  color: ${({ isError, theme }) => isError && theme.salmonRed};
  ${({ slippageWarning, highSlippageWarning, theme }) =>
    highSlippageWarning
      ? css`
          color: ${theme.salmonRed};
          font-weight: 600;
        `
      : slippageWarning &&
        css`
          background-color: ${transparentize(0.6, theme.warningYellow)};
          font-weight: 600;
          padding: 0.25rem;
        `}
`

const WrappedDropup = ({ isError, highSlippageWarning, ...rest }) => <Dropup {...rest} />
const ColoredDropup = styled(WrappedDropup)`
  path {
    stroke: ${({ isError, theme }) => (isError ? theme.salmonRed : theme.royalBlue)};

    ${({ highSlippageWarning, theme }) =>
      highSlippageWarning &&
      css`
        stroke: ${theme.salmonRed};
      `}
  }
`

const WrappedDropdown = ({ isError, highSlippageWarning, ...rest }) => <Dropdown {...rest} />
const ColoredDropdown = styled(WrappedDropdown)`
  path {
    stroke: ${({ isError, theme }) => (isError ? theme.salmonRed : theme.royalBlue)};

    ${({ highSlippageWarning, theme }) =>
      highSlippageWarning &&
      css`
        stroke: ${theme.salmonRed};
      `}
  }
`

export default function ContextualInfo({
  openDetailsText = 'Advanced Details',
  closeDetailsText = 'Hide Advanced',
  contextualInfo = '',
  allowExpand = false,
  isError = false,
  slippageWarning,
  highSlippageWarning,
  brokenTokenWarning,
  dropDownContent
}) {
  const [showDetails, setShowDetails] = useState(false)
  return !allowExpand ? (
    <SummaryWrapper brokenTokenWarning={brokenTokenWarning}>{contextualInfo}</SummaryWrapper>
  ) : (
    <>
      <SummaryWrapperContainer
        onClick={() => {
          !showDetails &&
            ReactGA.event({
              category: 'Advanced Interaction',
              action: 'Open Advanced Details',
              label: 'Swap/Send Page Details'
            })
          setShowDetails(s => !s)
        }}
      >
        <>
          <ErrorSpan isError={isError} slippageWarning={slippageWarning} highSlippageWarning={highSlippageWarning}>
            {(slippageWarning || highSlippageWarning) && (
              <span role="img" aria-label="warning">
                ⚠️
              </span>
            )}
            {contextualInfo ? contextualInfo : showDetails ? closeDetailsText : openDetailsText}
          </ErrorSpan>
          {showDetails ? (
            <ColoredDropup isError={isError} highSlippageWarning={highSlippageWarning} />
          ) : (
            <ColoredDropdown isError={isError} highSlippageWarning={highSlippageWarning} />
          )}
        </>
      </SummaryWrapperContainer>
      {showDetails && <Details>{dropDownContent()}</Details>}
    </>
  )
}
