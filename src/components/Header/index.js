import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import CometLogo from '../../assets/images/comet.png';
import AkraneLogo from '../../assets/images/arkane.svg';
import Web3Status from '../Web3Status';

import "./header.scss";

const links = {
  comet: {
    chrome: 'https://www.cometpowered.com/',
  },
  arkane: {
    chrome: 'https://www.arkane.network',
  },
};

function getArkaneLinks() {
  return links.arkane.chrome;
}

function getCometLinks() {
  return links.comet.chrome;
}

class BlockingWarning extends Component {
  constructor() {
    super();

    this.state = {
      wallets: [],
      arkaneConnect: {},
    };

    this.connectArkane = this.connectArkane.bind(this);
    this.manageWallets = this.manageWallets.bind(this);
  }

  componentDidMount() {
    const { arkaneConnect } = this.props;
    if (arkaneConnect) {
      arkaneConnect.api.getWallets()
        .then(wallets => {
          this.setState({ wallets });
        }).catch(err => {
          console.log('no wallet')
        });
    }
  }

  connectArkane() {
    window.arkaneConnect.authenticate();
  }

  manageWallets() {
  }

  render () {
    const {
      isConnected,
      initialized,
      networkId,
    } = this.props;

    const {
      wallets
    } = this.state;

    let content = [];

    const correctNetworkId = process.env.REACT_APP_NETWORK_ID || 74;
    const correctNetwork = process.env.REACT_APP_NETWORK || 'Main VeChain Network';

    const wrongNetwork = +networkId !== +correctNetworkId;

    if (wrongNetwork && initialized) {
      content = [
        <div key="warning-title">You are on the wrong network</div>,
        <div key="warning-desc" className="header__dialog__description">
          {`Please switch to ${correctNetwork}`}
        </div>,
      ];
    }

    if (!isConnected && initialized) {
      content = [
        <div key="warning-title">No Vechain wallet found</div>,
        <div key="warning-desc" className="header__dialog__description">
          Please visit us after installing Comet or Arkane Network
        </div>,
        <div key="warning-logos" className="header__download">
          {(
            [
              <img src={CometLogo} key="comet" onClick={() => window.open(getCometLinks(), '_blank')} />,
              <img src={AkraneLogo} key="arkane" onClick={() => window.open(getArkaneLinks(), '_blank')} />
            ]
          )}
        </div>,
      ];
    }

    return (
      <div
        className={classnames('header__dialog', {
          'header__dialog--disconnected': (!isConnected || wrongNetwork) && initialized,
        })}
      >
        {content}


        <div className="header__footer">
          <div className="header__dialog__description">
            You have no linked Arkane wallet
          </div>
          { (wallets.length === 0) &&
            <div className="header__authenticate-buttons">
              <button className="header__authenticate" onClick={this.connectArkane}>Connect Arkane Account</button>
            </div>
          }
        </div>
      </div>
    );
  }
}

function Header (props) {
  return (
    <div className="header">
      <BlockingWarning {...props} />
      <div
        className={classnames('header__top', {
          'header--inactive': !props.isConnected,
        })}
      >
        <div className="header__center-group">
          <span className="header__title">VEXCHANGE</span>
        </div>
        <Web3Status isConnected />
      </div>
    </div>
  )
}

Header.propTypes = {
  connectArkane: PropTypes.shape(),
  currentAddress: PropTypes.string,
  isConnected: PropTypes.bool.isRequired,
};

export default connect(
  state => ({
    currentAddress: state.web3connect.account,
    initialized: state.web3connect.initialized,
    isConnected: !!state.web3connect.account,
    web3: state.web3connect.web3,
    arkaneConnect: state.web3connect.arkaneConnect,
    networkId: state.web3connect.networkId,
  }),
)(Header);
