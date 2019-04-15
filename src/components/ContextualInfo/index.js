import React, { Component } from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';

import DropdownBlue from "../../assets/images/dropdown-blue.svg";
import DropupBlue from "../../assets/images/dropup-blue.svg";
import './contextual-info.scss';

class ContextualInfo extends Component {
  static propTypes = {
    openDetailsText: PropTypes.string,
    renderTransactionDetails: PropTypes.func,
    contextualInfo: PropTypes.string,
    isError: PropTypes.bool,
  };

  static defaultProps = {
    openDetailsText: 'Transaction Details',
    closeDetailsText: 'Hide Details',
    renderTransactionDetails() {},
    contextualInfo: '',
    isError: false,
  };

  state = {
    showDetails: false,
  };

  renderDetails() {
    if (!this.state.showDetails) {
      return null;
    }

    return (
      <div className="contextual-info__details">
        {this.props.renderTransactionDetails()}
      </div>
    );
  }

  render() {
    const {
      openDetailsText,
      closeDetailsText,
      contextualInfo,
      isError,
    } = this.props;

    if (contextualInfo) {
      return (
        <div className={c({ 'contextual-info--error': isError }, 'contextual-info__summary-wrapper')}>
          <div>{contextualInfo}</div>
        </div>
      );
    }

    return [
      <div
        key="open-details"
        className="contextual-info__summary-wrapper contextual-info__open-details-container"
        onClick={() => this.setState((prevState) => {
          return { showDetails: !prevState.showDetails }
        })}
      >
        {!this.state.showDetails ? (
          <>
            <span>{openDetailsText}</span>
            <img src={DropdownBlue} alt='dropdown' />
          </>
        ) : (
          <>
            <span>{closeDetailsText}</span>
            <img src={DropupBlue} alt='dropup' />
          </>
        )}
      </div>,
      this.renderDetails()
    ]
  }
}

export default ContextualInfo;
