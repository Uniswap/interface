import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Web3 from 'web3';
import Jazzicon from 'jazzicon';
import { Menu, Dropdown, Icon, Button } from 'antd';
import { updateWallet } from '../../ducks/web3connect';
import { CSSTransitionGroup } from "react-transition-group";
import { withNamespaces } from 'react-i18next';
import { isEqual } from 'lodash';
import './web3-status.scss';

import Modal from '../Modal';

function getVeforgeLink(tx) {
  return `https://veforge.com/transactions/${tx}`;
}

class Web3Status extends Component {
  constructor(props) {
    super(props);

    this.state = {
      wallets: props.wallets,
      isShowingModal: false,
    };

    this.renderMenu = this.renderMenu.bind(this);
  }

  componentWillReceiveProps({ wallets }) {
    if (!isEqual(this.props.wallets, wallets)) {
      this.setState({ wallets });
    }
  }

  handleClick = () => {
    if (this.props.pending.length && !this.state.isShowingModal) {
      this.setState({isShowingModal: true});
    }
  };

  handleMenuItemClick = wallet => {
    const { updateWallet } = this.props;
    updateWallet(wallet);
  }

  manageWallets = () => {
    window.arkaneConnect.manageWallets('VECHAIN');
  }

  logout = () => {
    window.arkaneConnect.logout();
  }

  renderPendingTransactions() {
    return this.props.pending.map((transaction) => {
      return (
        <Fragment>
          <div
            key={transaction}
            className={classnames('pending-modal__transaction-row')}
            onClick={() => window.open(getVeforgeLink(transaction), '_blank')}
          >
            <div className="pending-modal__transaction-label">
              {transaction}
            </div>
            <div className="pending-modal__pending-indicator">
              <div className="loader" /> {this.props.t("pending")}
            </div>
          </div>
        </Fragment>
      );
    });
  }

  renderMenu() {
    const { wallets = [] } = this.props;
    return (
      <Menu>
        { wallets.map(wallet => (
          <Menu.Item key={wallet.id} onClick={() => this.handleMenuItemClick(wallet)}>
            { wallet.description }
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item key="manage" onClick={this.manageWallets}>
          Manage Wallets
        </Menu.Item>
        <Menu.Item key="logout" onClick={this.logout}>
          Log out of Arkane
        </Menu.Item>
      </Menu>
    );
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
    const { t, address, pending, confirmed, wallets = [], wallet } = this.props;
    const hasPendingTransactions = !!pending.length;
    const hasConfirmedTransactions = !!confirmed.length;

    return (
      <Dropdown
        placement="bottomLeft"
        overlay={(wallets.length > 0) ? this.renderMenu : <div></div>}>
        <Button>
          <div className={classnames("web3-status", {
            'web3-status__connected': this.props.isConnected,
            'web3-status--pending': hasPendingTransactions,
            'web3-status--confirmed': hasConfirmedTransactions,
          })}
          onClick={this.handleClick}
          >
            <div className="web3-status__text">
              { hasPendingTransactions ?
                  getPendingText(pending, t("pending")) : 
                  (wallet || {}).description ||
                  getText(address, t("disconnected")) 
              }
            </div>
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
                el.appendChild(Jazzicon(16, parseInt(address.slice(2), 16)));
              }}
            />
            {this.renderModal()}
          </div>

        </Button>
      </Dropdown>
    );
  }
}



function getPendingText(pendingTransactions, pendingLabel) {
  return (
    <div className="web3-status__pending-container">
      <div className="loader" />
      <span key="text">{pendingTransactions.length} {pendingLabel}</span>
    </div>
  );
}

function getText(text, disconnectedText) {
  if (!text || text.length < 42 || !Web3.utils.isHexStrict(text)) {
    return disconnectedText;
  }

  const address = Web3.utils.toChecksumAddress(text);
  return `${address.substring(0, 6)}...${address.substring(38)}`;
}

Web3Status.propTypes = {
  isConnected: PropTypes.bool,
  wallets: PropTypes.array,
  address: PropTypes.string,
};

Web3Status.defaultProps = {
  isConnected: false,
  address: 'Disconnected',
};

export default connect(
  state => ({
    wallet: state.web3connect.wallet,
    wallets: state.web3connect.wallets,
    address: state.web3connect.account,
    isConnected: !!(state.web3connect.web3 && state.web3connect.account),
    pending: state.web3connect.transactions.pending,
    confirmed: state.web3connect.transactions.confirmed,
  }),
  dispatch => ({
    updateWallet: wallet => dispatch(updateWallet(wallet)),
  }),
)(withNamespaces()(Web3Status));
