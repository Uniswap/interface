import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import UAParser from 'ua-parser-js';
import Logo from '../Logo';
import CipherLogo from '../../assets/images/cipher-browser-logo.svg';
import TrustLogo from '../../assets/images/trust-wallet-logo.svg';
import Web3Status from '../Web3Status';

import "./header.scss";
import NavigationTabs from "../NavigationTabs";

const links = {
  cipher: {
    android: 'https://play.google.com/store/apps/details?id=com.cipherbrowser.cipher&hl=en_US',
    ios: 'https://itunes.apple.com/us/app/cipher-browser-ethereum/id1294572970?mt=8',
  },
  trust: {
    android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp&hl=en_US',
    ios: 'https://itunes.apple.com/us/app/trust-ethereum-wallet/id1288339409?mt=8',
  },
};

const ua = new UAParser(window.navigator.userAgent);

function getTrustLink() {
  const os = ua.getOS();

  if (os.name === 'Android') {
    return links.trust.android;
  }

  if (os.name === 'iOS') {
    return links.trust.ios;
  }
}

function getCipherLink() {
  const os = ua.getOS();

  if (os.name === 'Android') {
    return links.cipher.android;
  }

  if (os.name === 'iOS') {
    return links.cipher.ios;
  }
}

function Header (props) {
  return (
    <div className="header">
      <div
        className={classnames('header__dialog', {
          'header__dialog--disconnected': !props.isConnected,
        })}
      >
        <div>No Ethereum wallet found</div>
        <div className="header__dialog__description">Please visit us from a web3-enabled mobile browser, such as Trust Wallet and Cipher Browser.</div>
        <div className="header__download">
          <img src={CipherLogo} onClick={() => window.open(getCipherLink(), '_blank')} />
          <img src={TrustLogo} onClick={() => window.open(getTrustLink(), '_blank')} />
        </div>
      </div>
      <div
        className={classnames('header__top', {
          'header--inactive': !props.isConnected,
        })}
      >
        <Logo />
        <div className="header__center-group">
          <span className="header__title">Uniswap</span>
        </div>
        <Web3Status address="0xcf1de0b4d1e492080336909f70413a5f4e7eec62" isConnected />
      </div>
      <NavigationTabs
        className={classnames('header__navigation', {
          'header--inactive': !props.isConnected,
        })}
      />
    </div>
  )
}

Header.propTypes = {
  web3: PropTypes.object.isRequired,
  currentAddress: PropTypes.string,
  isConnected: PropTypes.bool.isRequired,
};

export default connect(
  state => ({
    web3: state.web3.web3,
    currentAddress: state.web3.currentAddress,
    isConnected: !!(state.web3.web3 && state.web3.currentAddress),
  }),
)(Header)