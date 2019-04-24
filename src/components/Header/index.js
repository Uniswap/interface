import React from 'react'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { useWeb3Context, Connectors } from 'web3-react'
import UAParser from 'ua-parser-js'

import Logo from '../Logo'
import CoinbaseWalletLogo from '../../assets/images/coinbase-wallet-logo.png'
import TrustLogo from '../../assets/images/trust-wallet-logo.svg'
import BraveLogo from '../../assets/images/brave-logo.svg'
import MetamaskLogo from '../../assets/images/metamask-logo.svg'
import Web3Status from '../Web3Status'

import './header.scss'

const { Connector, InjectedConnector } = Connectors

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

const ua = new UAParser(window.navigator.userAgent)
function isMobile() {
  return ua.getDevice().type === 'mobile'
}

function BaseBlockingWarning({ title, description, children }) {
  return (
    <div
      className={classnames('header__dialog', {
        'header__dialog--disconnected': true
      })}
    >
      <div key="warning-title">{title}</div>
      <div key="warning-desc" className="header__dialog__description">
        {description}
      </div>
      {children}
    </div>
  )
}

function BlockingWarning() {
  const { t } = useTranslation()

  const correctNetwork = process.env.REACT_APP_NETWORK_NAME || 'Main Ethereum Network'
  const context = useWeb3Context()

  if (context.error && context.error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
    return <BaseBlockingWarning title={t('wrongNetwork')} description={t('switchNetwork', { correctNetwork })} />
  }

  // this is an intermediate state before infura is set
  if (context.error && context.error.code === InjectedConnector.errorCodes.UNLOCK_REQUIRED) {
    return null
  }

  if (context.error) {
    console.error(context.error)
    return <BaseBlockingWarning title={t('disconnected')} />
  }

  if (!context.account) {
    return (
      <BaseBlockingWarning
        title={t('noWallet')}
        description={isMobile() ? t('installWeb3MobileBrowser') : t('installMetamask')}
      >
        <div key="warning-logos" className="header__download">
          {isMobile() ? (
            <>
              <img
                alt="coinbase"
                src={CoinbaseWalletLogo}
                key="coinbase-wallet"
                onClick={() => window.open(getCoinbaseWalletLink(), '_blank')}
              />
              <img alt="trust" src={TrustLogo} key="trust" onClick={() => window.open(getTrustLink(), '_blank')} />
            </>
          ) : (
            <>
              <img
                alt="metamask"
                src={MetamaskLogo}
                key="metamask"
                onClick={() => window.open(getMetamaskLink(), '_blank')}
              />
              <img alt="brave" src={BraveLogo} key="brave" onClick={() => window.open(getBraveLink(), '_blank')} />
            </>
          )}
        </div>
      </BaseBlockingWarning>
    )
  }

  return null
}

export default function Header() {
  const context = useWeb3Context()

  return (
    <div className="header">
      <BlockingWarning />
      <div className={classnames('header__top')}>
        <a className="header__no-decoration" href="https://uniswap.io" target="_blank" rel="noopener noreferrer">
          <Logo />
        </a>

        <div className="header__center-group">
          <a className="header__no-decoration" href="https://uniswap.io" target="_blank" rel="noopener noreferrer">
            <span className="header__title">Uniswap</span>
          </a>
        </div>

        <Web3Status isConnected={!!(context.active && context.account)} />
      </div>
    </div>
  )
}
