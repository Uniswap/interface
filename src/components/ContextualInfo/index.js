import React, { Component } from 'react';
import PropTypes from 'prop-types';
import c from 'classnames';
import { CSSTransitionGroup } from "react-transition-group";

import Modal from '../Modal';
import DropdownBlue from "../../assets/images/dropdown-blue.svg";
import DropupBlue from "../../assets/images/dropup-blue.svg";
import './contextual-info.scss';

class ContextualInfo extends Component {
  static propTypes = {
    openModalText: PropTypes.string,
    renderTransactionDetails: PropTypes.func,
    contextualInfo: PropTypes.string,
    modalClass: PropTypes.string,
    isError: PropTypes.bool,
  };

  static defaultProps = {
    openModalText: 'Transaction Details',
    renderTransactionDetails() {},
    contextualInfo: '',
    modalClass: '',
    isError: false,
  };

  state = {
    showDetailModal: false,
  };

  renderModal() {
    if (!this.state.showDetailModal) {
      return null;
    }

    const { modalClass } = this.props;

    return (
      <Modal key="modal" onClose={() => this.setState({ showDetailModal: false })}>
        <CSSTransitionGroup
          transitionName="summary-modal"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className={c('contextual-info__summary-modal', modalClass)}>
            <div
              key="open-details"
              className="contextual-info__open-details-container contextual-info__modal-button"
              onClick={() => this.setState({showDetailModal: false})}
            >
              <span>Transaction Details</span>
              <img src={DropupBlue} />
            </div>
            {this.props.renderTransactionDetails()}
          </div>
        </CSSTransitionGroup>
      </Modal>
    );
  }

  render() {
    const {
      openModalText,
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
        onClick={() => this.setState({showDetailModal: true})}
      >
        <span>{openModalText}</span>
        <img src={DropdownBlue} />
      </div>,
      this.renderModal()
    ]
  }
}

export default ContextualInfo;
