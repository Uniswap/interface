import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import UAParser from 'ua-parser-js';
import Logo from '../Logo';
import CoinbaseWalletLogo from '../../assets/images/coinbase-wallet-logo.png';
import TrustLogo from '../../assets/images/trust-wallet-logo.svg';
import BraveLogo from '../../assets/images/brave-logo.png';
import MetamaskLogo from '../../assets/images/metamask-logo.png';
import Web3Status from '../Web3Status';

import "./header.scss";

const links = {
  coinbaseWallet: {
    android: 'https://play.google.com/store/apps/details?id=org.toshi',
    ios: 'https://itunes.apple.com/us/app/coinbase-wallet/id1278383455'
  },
  trust: {
    android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp&hl=en_US',
    ios: 'https://itunes.apple.com/us/app/trust-ethereum-wallet/id1288339409?mt=8',
  },
  metamask: {
    chrome: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
  },
  brave: {
    android: 'https://play.google.com/store/apps/details?id=com.brave.browser',
    ios: 'https://itunes.apple.com/us/app/brave-browser-fast-adblocker/id1052879175',
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

function getBraveLink() {
  const os = ua.getOS();

  if (os.name === 'Mac OS') {
    return links.brave.ios;
  }

  return links.brave.android;
}

function getMetamaskLink() {
  return links.metamask.chrome;
}

function isMobile() {
  return ua.getDevice().type === 'mobile';
}

function Header (props) {
  return (
    <div className="header">
      <div
        className={classnames('header__dialog', {
          'header__dialog--disconnected': !props.isConnected && props.initialized,
        })}
      >
        <div>No Ethereum wallet found</div>
        <div className="header__dialog__description">
          {
            isMobile()
              ? 'Please visit us from a web3-enabled mobile browser, such as Trust Wallet and Cipher Browser.'
              : 'Please visit us after installing Metamask on Chrome or Brave.'

          }
        </div>
        <div className="header__download">
          {
            isMobile()
              ? (
                [
                  <img src={CoinbaseWalletLogo} key="coinbase-wallet" onClick={() => window.open(getCoinbaseWalletLink(), '_blank')} />,
                  <img src={TrustLogo} key="trust" onClick={() => window.open(getTrustLink(), '_blank')} />
                ]
              )
              : (
                [
                  <img src={MetamaskLogo} key="metamask" onClick={() => window.open(getMetamaskLink(), '_blank')} />,
                  <img src={BraveLogo} key="brave" onClick={() => window.open(getBraveLink(), '_blank')} />
                ]
              )
          }
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
    </div>
  )
}

Header.propTypes = {
  currentAddress: PropTypes.string,
  isConnected: PropTypes.bool.isRequired,
};

export default connect(
  state => ({
    currentAddress: state.web3connect.account,
    initialized: state.web3connect.initialized,
    isConnected: !!state.web3connect.web3 && !!state.web3connect.account,
  }),
)(Header);
