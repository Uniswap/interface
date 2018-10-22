import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';
import classnames from "classnames";
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import ModeSelector from './ModeSelector';
import "./pool.scss";

class AddLiquidity extends Component {
  static propTypes = {
    currentAddress: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
  };

  render() {
    return (
      <div
        className={classnames('swap__content', {
          'swap--inactive': !this.props.isConnected,
        })}
      >
        <ModeSelector />
        <CurrencyInputPanel
          title="Deposit"
          extraText="Balance: 0.03141"
        />
        <OversizedPanel>
          <div className="swap__down-arrow-background">
            <img className="swap__down-arrow" src={ArrowDown} />
          </div>
        </OversizedPanel>
        <CurrencyInputPanel
          title="Deposit"
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
        <div className="pool__cta-container">
          <button
            className={classnames('pool__cta-btn', {
              'swap--inactive': !this.props.isConnected,
              'pool__cta-btn--inactive': !this.props.isValid,
            })}
            disabled={!this.props.isValid}
            onClick={this.onSwap}
          >
            Swap
          </button>
        </div>
      </div>
    );
  }
}

export default drizzleConnect(
  AddLiquidity,
  (state, ownProps) => ({
    currentAddress: state.accounts[0],
    isConnected: !!(state.drizzleStatus.initialized && state.accounts[0]),
  }),
)

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}
