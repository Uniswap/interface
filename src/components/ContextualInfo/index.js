import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import DropdownBlue from '../../assets/images/dropdown-blue.svg'
import DropupBlue from '../../assets/images/dropup-blue.svg'

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

class ContextualInfo extends Component {
  static propTypes = {
    openDetailsText: PropTypes.string,
    renderTransactionDetails: PropTypes.func,
    contextualInfo: PropTypes.string,
    isError: PropTypes.bool
  }

  static defaultProps = {
    openDetailsText: 'Transaction Details',
    closeDetailsText: 'Hide Details',
    renderTransactionDetails() {},
    contextualInfo: '',
    isError: false
  }

  state = {
    showDetails: false
  }

  renderDetails() {
    if (!this.state.showDetails) {
      return null
    }

    return <div className="contextual-info__details">{this.props.renderTransactionDetails()}</div>
  }

  render() {
    const { openDetailsText, closeDetailsText, contextualInfo, isError } = this.props

    if (contextualInfo) {
      return <SummaryWrapper error={isError}>{contextualInfo}</SummaryWrapper>
    }

    return (
      <>
        <SummaryWrapperContainer
          onClick={() =>
            this.setState(prevState => {
              return { showDetails: !prevState.showDetails }
            })
          }
        >
          {!this.state.showDetails ? (
            <>
              <span>{openDetailsText}</span>
              <img src={DropdownBlue} alt="dropdown" />
            </>
          ) : (
            <>
              <span>{closeDetailsText}</span>
              <img src={DropupBlue} alt="dropup" />
            </>
          )}
        </SummaryWrapperContainer>
        {this.renderDetails()}
      </>
    )
  }
}

export default ContextualInfo
