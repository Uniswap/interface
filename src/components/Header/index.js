import React from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react'
import classnames from 'classnames';
import UAParser from 'ua-parser-js';
import Logo from '../Logo';
import CoinbaseWalletLogo from '../../assets/images/coinbase-wallet-logo.png';
import TrustLogo from '../../assets/images/trust-wallet-logo.svg';
import Web3Status from '../Web3Status';

import "./header.scss";
import NavigationTabs from "../NavigationTabs";

const links = {
  coinbaseWallet: {
    android: 'https://play.google.com/store/apps/details?id=org.toshi',
    ios: 'https://itunes.apple.com/us/app/coinbase-wallet/id1278383455'
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

function getCoinbaseWalletLink() {
  const os = ua.getOS();

  if (os.name === 'Android') {
    return links.coinbaseWallet.android;
  }

  if (os.name === 'iOS') {
    return links.coinbaseWallet.ios;
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
        <div className="header__dialog__description">
          Please visit us from a web3-enabled mobile browser, such as Trust Wallet and Coinbase Wallet.
        </div>
        <div className="header__download">
          <img src={CoinbaseWalletLogo} onClick={() => window.open(getCoinbaseWalletLink(), '_blank')} />
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
        <Web3Status isConnected />
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
  currentAddress: PropTypes.string,
  isConnected: PropTypes.bool.isRequired,
};

export default drizzleConnect(
  Header,
  state => ({
    // web3: console.log(state) || state.web3,
    currentAddress: state.accounts[0],
    isConnected: !!(state.drizzleStatus.initialized && state.accounts[0]),
  }),
);
