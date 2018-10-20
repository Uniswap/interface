import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react'
import classnames from 'classnames';
import Web3 from 'web3';
import Jazzicon from 'jazzicon';
import { CSSTransitionGroup } from "react-transition-group";
import './web3-status.scss';
import Pending from '../../assets/images/pending.svg';
import Modal from '../Modal';

function getEtherscanLink(tx) {
  return `https://etherscan.io/tx/${tx}`;
}

class Web3Status extends Component {
  state = {
    isShowingModal: false,
  };

  handleClick = () => {
    if (this.props.hasPendingTransactions && !this.state.isShowingModal) {
      this.setState({isShowingModal: true});
    }
  }

  renderPendingTransactions() {
    return this.props.pendingTransactions.map((transaction) => {
      return (
        <div
          key={transaction}
          className={classnames('pending-modal__transaction-row')}
          onClick={() => window.open(getEtherscanLink(transaction), '_blank')}
        >
          <div className="pending-modal__transaction-label">
            {transaction}
          </div>
          <div className="pending-modal__pending-indicator">
            <img src={Pending} />
            Pending
          </div>
        </div>
      );
    });
  }

  renderModal() {
    if (!this.state.isShowingModal) {
      return null;
    }

    return (
      <Modal onClose={() => this.setState({ isShowingModal: false })}>
        <CSSTransitionGroup
          transitionName="token-modal"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className="pending-modal">
            <div className="pending-modal__transaction-list">
              <div className="pending-modal__header">Transactions</div>
              {this.renderPendingTransactions()}
            </div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    );
  }

  render() {
    const { address, transactions, pendingTransactions, hasPendingTransactions } = this.props;
    console.count('hi');
    let text = getText(address);
    if (hasPendingTransactions) {
      text = getPendingText(pendingTransactions);
    }

    return (
      <div
        className={classnames("web3-status", {
          'web3-status__connected': this.props.isConnected,
        })}
        onClick={this.handleClick}
      >
        <div
          className="web3-status__identicon"
          ref={el => {
            if (!el) {
              return;
            }

            if (!address|| address.length < 42 || !Web3.utils.isHexStrict(address)) {
              return;
            }

            el.innerHTML = '';
            el.appendChild(Jazzicon(18, parseInt(address.slice(2), 16)));
          }}
        />
        <div className="web3-status__text">
          {
            hasPendingTransactions ?
              getPendingText(pendingTransactions) :
              getText(address)
          }
        </div>
        {this.renderModal()}
      </div>
    );
  }
}



function getPendingText(pendingTransactions) {
  return (
    <div className="web3-status__pending-container">
      <img key="icon" src={Pending} />
      <span key="text">{pendingTransactions.length} Pending</span>
    </div>
  );
}

function getText(text) {
  if (!text || text.length < 42 || !Web3.utils.isHexStrict(text)) {
    return 'Disconnected';
  }

  const address = Web3.utils.toChecksumAddress(text);
  return `${address.substring(0, 6)}...${address.substring(38)}`;
}

Web3Status.propTypes = {
  isConnected: PropTypes.bool,
  address: PropTypes.string,
};

Web3Status.defaultProps = {
  isConnected: false,
  address: 'Disconnected',
};

export default drizzleConnect(
  Web3Status,
  state => {
    const pendingTransactions = [];
    Object.keys(state.transactions).forEach((transaction) => {
      if (state.transactions[transaction] && state.transactions[transaction].status === 'pending') {
        pendingTransactions.push(transaction);
      }
    });

    return {
      address: state.accounts[0],
      isConnected: !!(state.drizzleStatus.initialized && state.accounts[0]),
      pendingTransactions,
      hasPendingTransactions: pendingTransactions.length > 0,
    };
  }
);
