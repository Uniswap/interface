import React, { useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as Dropup } from '../../assets/images/dropup-blue.svg'
import { ReactComponent as Dropdown } from '../../assets/images/dropdown-blue.svg'

const SummaryWrapper = styled.div`
  color: ${({ error, theme }) => (error ? theme.salmonRed : theme.doveGray)};
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

  span {
    margin-right: 12px;
  }

  img {
    height: 0.75rem;
    width: 0.75rem;
  }
`

const Details = styled.div`
  background-color: ${({ theme }) => theme.concreteGray};
  padding: 1.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  margin-top: 1rem;
`

const ErrorSpan = styled.span`
  color: ${({ isError, theme }) => isError && theme.salmonRed};
`

const WrappedDropup = ({ isError, ...rest }) => <Dropup {...rest} />
const ColoredDropup = styled(WrappedDropup)`
  path {
    stroke: ${({ isError, theme }) => isError && theme.salmonRed};
  }
`

const WrappedDropdown = ({ isError, ...rest }) => <Dropdown {...rest} />
const ColoredDropdown = styled(WrappedDropdown)`
  path {
    stroke: ${({ isError, theme }) => isError && theme.salmonRed};
  }
`

export default function ContextualInfo({
  openDetailsText = 'Transaction Details',
  closeDetailsText = 'Hide Details',
  contextualInfo = '',
  allowExpand = false,
  renderTransactionDetails = () => {},
  isError = false
}) {
  const [showDetails, setShowDetails] = useState(false)

  return !allowExpand ? (
    <SummaryWrapper>{contextualInfo}</SummaryWrapper>
  ) : (
    <>
      <SummaryWrapperContainer onClick={() => setShowDetails(s => !s)}>
        <>
          <ErrorSpan isError={isError}>
            {contextualInfo ? contextualInfo : showDetails ? closeDetailsText : openDetailsText}
          </ErrorSpan>
          {showDetails ? <ColoredDropup isError={isError} /> : <ColoredDropdown isError={isError} />}
        </>
      </SummaryWrapperContainer>
      {showDetails && <Details>{renderTransactionDetails()}</Details>}
    </>
  )
}
