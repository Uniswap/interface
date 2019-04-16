import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classnames from 'classnames'
import UAParser from 'ua-parser-js'
import { withTranslation } from 'react-i18next'
import Logo from '../Logo'
import CoinbaseWalletLogo from '../../assets/images/coinbase-wallet-logo.png'
import TrustLogo from '../../assets/images/trust-wallet-logo.svg'
import BraveLogo from '../../assets/images/brave-logo.svg'
import MetamaskLogo from '../../assets/images/metamask-logo.svg'
import Web3Status from '../Web3Status'

import './header.scss'

const links = {
  coinbaseWallet: {
    android: 'https://play.google.com/store/apps/details?id=org.toshi',
    ios: 'https://itunes.apple.com/us/app/coinbase-wallet/id1278383455'
  },
  trust: {
    android:
      'https://links.trustwalletapp.com/a/key_live_lfvIpVeI9TFWxPCqwU8rZnogFqhnzs4D?&event=openURL&url=https://uniswap.exchange/swap',
    ios:
      'https://links.trustwalletapp.com/a/key_live_lfvIpVeI9TFWxPCqwU8rZnogFqhnzs4D?&event=openURL&url=https://uniswap.exchange/swap'
  },
  metamask: {
    chrome: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
  },
  brave: {
    android: 'https://play.google.com/store/apps/details?id=com.brave.browser',
    ios: 'https://itunes.apple.com/us/app/brave-browser-fast-adblocker/id1052879175'
  }
}

const ua = new UAParser(window.navigator.userAgent)

function getTrustLink() {
  const os = ua.getOS()

  if (os.name === 'Android') {
    return links.trust.android
  }

  if (os.name === 'iOS') {
    return links.trust.ios
  }
}

function getCoinbaseWalletLink() {
  const os = ua.getOS()

  if (os.name === 'Android') {
    return links.coinbaseWallet.android
  }

  if (os.name === 'iOS') {
    return links.coinbaseWallet.ios
  }
}

function getBraveLink() {
  const os = ua.getOS()

  if (os.name === 'Mac OS') {
    return links.brave.ios
  }

  return links.brave.android
}

function getMetamaskLink() {
  return links.metamask.chrome
}

function isMobile() {
  return ua.getDevice().type === 'mobile'
}

class BlockingWarning extends Component {
  render() {
    const { t, isConnected, initialized, networkId } = this.props
    let content = []

    const correctNetworkId = process.env.REACT_APP_NETWORK_ID || 1
    const correctNetwork = process.env.REACT_APP_NETWORK || 'Main Ethereum Network'

    const wrongNetwork = networkId !== correctNetworkId

    if (wrongNetwork && initialized) {
      content = [
        <div key="warning-title">{t('wrongNetwork')}</div>,
        <div key="warning-desc" className="header__dialog__description">
          {t('switchNetwork', { correctNetwork })}
        </div>
      ]
    }

    if (!isConnected && initialized) {
      content = [
        <div key="warning-title">{t('noWallet')}</div>,
        <div key="warning-desc" className="header__dialog__description">
          {isMobile() ? t('installWeb3MobileBrowser') : t('installMetamask')}
        </div>,
        <div key="warning-logos" className="header__download">
          {isMobile()
            ? [
                <img
                  alt="coinbase"
                  src={CoinbaseWalletLogo}
                  key="coinbase-wallet"
                  onClick={() => window.open(getCoinbaseWalletLink(), '_blank')}
                />,
                <img alt="trust" src={TrustLogo} key="trust" onClick={() => window.open(getTrustLink(), '_blank')} />
              ]
            : [
                <img
                  alt="metamask"
                  src={MetamaskLogo}
                  key="metamask"
                  onClick={() => window.open(getMetamaskLink(), '_blank')}
                />,
                <img alt="brave" src={BraveLogo} key="brave" onClick={() => window.open(getBraveLink(), '_blank')} />
              ]}
        </div>
      ]
    }

    return (
      <div
        className={classnames('header__dialog', {
          'header__dialog--disconnected': (!isConnected || wrongNetwork) && initialized
        })}
      >
        {content}
      </div>
    )
  }
}

function Header(props) {
  return (
    <div className="header">
      <BlockingWarning {...props} />
      <div
        className={classnames('header__top', {
          'header--inactive': !props.isConnected
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
  isConnected: PropTypes.bool.isRequired
}

export default connect(state => ({
  currentAddress: state.web3connect.account,
  initialized: state.web3connect.initialized,
  isConnected: !!state.web3connect.account,
  web3: state.web3connect.web3,
  networkId: state.web3connect.networkId
}))(withTranslation()(Header))
