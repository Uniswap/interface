import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Header from '../../components/Header';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import AddressInputPanel from '../../components/AddressInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';

import "./send.scss";

class Send extends Component {
  static propTypes = {
    // Injected by React Router Dom
    push: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    currentAddress: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
  };

  render() {
    return (
      <div className="send">
        <Header />
        <div
          className={classnames('swap__content', {
            'swap--inactive': !this.props.isConnected,
          })}
        >
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
          <OversizedPanel>
            <div className="swap__down-arrow-background">
              <img className="swap__down-arrow" src={ArrowDown} />
            </div>
          </OversizedPanel>
          <AddressInputPanel />
          <OversizedPanel hideBottom>
            <div className="swap__exchange-rate-wrapper">
              <span className="swap__exchange-rate">Exchange Rate</span>
              <span>1 ETH = 1283.878 BAT</span>
            </div>
          </OversizedPanel>
          <div className="swap__summary-wrapper">
            <div>You are selling <span className="swap__highlight-text">0.01 ETH</span></div>
            <div>You will receive between <span className="swap__highlight-text">12.80</span> and <span className="swap__highlight-text">12.83 BAT</span></div>
          </div>
        </div>
        <button
          className={classnames('swap__cta-btn', {
            'swap--inactive': !this.props.isConnected,
          })}
        >
          Send
        </button>

      </div>
    );
  }
}

export default withRouter(
  drizzleConnect(
    Send,
    (state, ownProps) => ({
      push: ownProps.history.push,
      pathname: ownProps.location.pathname,
      currentAddress: state.accounts[0],
      isConnected: !!(state.drizzleStatus.initialized && state.accounts[0]),
    }),
  ),
);
