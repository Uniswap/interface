import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import classnames from "classnames";
import Header from '../../components/Header';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import Dropdown from '../../assets/images/dropdown.svg';

import "./pool.scss";

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}

class Pool extends Component {
  static propTypes = {
    // Injected by React Router Dom
    push: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    web3: PropTypes.object.isRequired,
    currentAddress: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
  };

  render() {
    return (
      <div className="pool">
        <Header />
        <div
          className={classnames('swap__content', {
            'swap--inactive': !this.props.isConnected,
          })}
        >
          <OversizedPanel hideTop>
            <div className="pool__liquidity-container">
              <span className="pool__liquidity-label">Add Liquidity</span>
              <img src={Dropdown} />
            </div>
          </OversizedPanel>
          <CurrencyInputPanel
            title="Input"
            extraText="Balance: 0.03141"
          />
          <OversizedPanel>
            <div className="swap__down-arrow-background">
              <img className="swap__down-arrow" src={ArrowDown} />
            </div>
          </OversizedPanel>
          <CurrencyInputPanel
            title="Output"
            description="(estimated)"
            extraText="Balance: 0.0"
          />
          <OversizedPanel hideBottom>
            <div className="pool__summary-panel">
              <div className="pool__exchange-rate-wrapper">
                <span className="pool__exchange-rate">Exchange Rate</span>
                <span>1 ETH = 1283.878 BAT</span>
              </div>
              <div className="pool__exchange-rate-wrapper">
                <span className="swap__exchange-rate">Current Pool Size</span>
                <span>321 ETH / 321,000 BAT</span>
              </div>
            </div>
          </OversizedPanel>
          <div className="swap__summary-wrapper">
            <div>You are adding between {b`212000.00 - 216000.00 BAT`} + {b`166.683543 ETH`} into the liquidity pool.</div>
            <div className="pool__last-summary-text">You will receive between {b`66%`} and {b`67%`} of the BAT/ETH pool tokens.</div>
          </div>
        </div>
        <button
          className={classnames('swap__cta-btn', {
            'swap--inactive': !this.props.isConnected,
          })}
        >
          Add Liquidity
        </button>
      </div>
    );
  }
}

export default withRouter(
  connect(
    (state, ownProps) => ({
      push: ownProps.history.push,
      pathname: ownProps.location.pathname,
      web3: state.web3.web3,
      currentAddress: state.web3.currentAddress,
      isConnected: !!(state.web3.web3 && state.web3.currentAddress),
    }),
  )(Pool)
);
