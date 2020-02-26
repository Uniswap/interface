import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import ReactGA from 'react-ga'
import { ReactComponent as Dropup } from '../../assets/images/dropup-blue.svg'
import { ReactComponent as Dropdown } from '../../assets/images/dropdown-blue.svg'

const SummaryWrapper = styled.div`
  color: ${({ error, theme }) => (error ? theme.salmonRed : theme.doveGray)};
  font-size: 0.75rem;
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
`

const Details = styled.div`
  background-color: ${({ theme }) => theme.concreteGray};
  padding: 1.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  margin-top: 1rem;
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

const WrappedDropup = ({ isError, highSlippageWarning, ...rest }) => <Dropup {...rest} />
const ColoredDropup = styled(WrappedDropup)`
  path {
    stroke: ${({ theme }) => theme.royalBlue};
  }
`

const WrappedDropdown = ({ isError, highSlippageWarning, ...rest }) => <Dropdown {...rest} />
const ColoredDropdown = styled(WrappedDropdown)`
  path {
    stroke: ${({ theme }) => theme.royalBlue};
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
    openDetailsText: 'Advanced Details',
    closeDetailsText: 'Hide Advanced',
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
    return <Details>{this.props.renderTransactionDetails()}</Details>
  }

  render() {
    const { openDetailsText, closeDetailsText, contextualInfo, isError } = this.props

    if (contextualInfo) {
      return <SummaryWrapper error={isError}>{contextualInfo}</SummaryWrapper>
    }

    return (
      <>
        <SummaryWrapperContainer
          onClick={() => {
            !this.state.showDetails &&
              ReactGA.event({
                category: 'Advanced Interaction',
                action: 'Open Advanced Details',
                label: 'Pool Page Details'
              })
            this.setState(prevState => {
              return { showDetails: !prevState.showDetails }
            })
          }}
        >
          {!this.state.showDetails ? (
            <>
              <span>{openDetailsText}</span>
              <ColoredDropup />
            </>
          ) : (
            <>
              <span>{closeDetailsText}</span>
              <ColoredDropdown />
            </>
          )}
        </SummaryWrapperContainer>
        {this.renderDetails()}
      </>
    )
  }
}

export default ContextualInfo
