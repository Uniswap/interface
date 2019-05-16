import React, { useState } from 'react'
import styled from 'styled-components'
import c from 'classnames'

import { ReactComponent as Dropup } from '../../assets/images/dropup-blue.svg'
import { ReactComponent as Dropdown } from '../../assets/images/dropdown-blue.svg'

import './contextual-info.scss'

const WrappedDropup = ({ isError, ...rest }) => <Dropup {...rest} />
const ColoredDropup = styled(WrappedDropup)`
  path {
    stroke: ${props => props.isError && props.theme.salmonRed};
  }
`

const WrappedDropdown = ({ isError, ...rest }) => <Dropdown {...rest} />
const ColoredDropdown = styled(WrappedDropdown)`
  path {
    stroke: ${props => props.isError && props.theme.salmonRed};
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
    <div className={c({ 'contextual-info--error': isError }, 'contextual-info__summary-wrapper')}>
      <div>{contextualInfo}</div>
    </div>
  ) : (
    <>
      <div
        key="open-details"
        className="contextual-info__summary-wrapper contextual-info__open-details-container"
        onClick={() => setShowDetails(s => !s)}
      >
        <>
          <span className={c({ 'contextual-info--error': isError })}>
            {contextualInfo ? contextualInfo : showDetails ? closeDetailsText : openDetailsText}
          </span>
          {showDetails ? <ColoredDropup isError={isError} /> : <ColoredDropdown isError={isError} />}
        </>
      </div>
      {showDetails && <div className="contextual-info__details">{renderTransactionDetails()}</div>}
    </>
  )
}
