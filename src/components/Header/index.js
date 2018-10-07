import React from 'react';
import Logo from '../Logo';
import Web3Status from '../Web3Status';

import "./header.scss";
import NavigationTabs from "../NavigationTabs";

export default function Header (props) {
  return (
    <div className="header">
      <div className="header__top">
        <Logo />
        <div className="header__center-group">
          <span className="header__title">Uniswap</span>
        </div>
        <Web3Status address="0xcf1de0b4d1e492080336909f70413a5f4e7eec62" isConnected />
      </div>
      <NavigationTabs className="header__navigation" />
    </div>
  )
}
