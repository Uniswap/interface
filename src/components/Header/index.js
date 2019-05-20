import React from 'react'
import classnames from 'classnames'
import { useWeb3Context } from 'web3-react'

import Logo from '../Logo'
import Web3Status from '../Web3Status'

import './header.scss'

export default function Header() {
  const context = useWeb3Context()

  return (
    <div className="header">
      <div className={classnames('header__top')}>
        <a className="header__no-decoration" href="https://uniswap.io" target="_blank" rel="noopener noreferrer">
          <Logo />
        </a>

        <div className="header__center-group">
          <a className="header__no-decoration" href="https://uniswap.io" target="_blank" rel="noopener noreferrer">
            <span className="header__title">Uniswap</span>
          </a>
        </div>

        {context.active && <Web3Status isConnected={!!context.account} />}
      </div>
    </div>
  )
}
