import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';
import classnames from "classnames";
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import { Selectors } from '../../ducks/web3connect';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import ModeSelector from './ModeSelector';
import "./pool.scss";

const INPUT = 0;
const OUTPUT = 1;

class AddLiquidity extends Component {
  static propTypes = {
    isConnected: PropTypes.bool.isRequired,
    account: PropTypes.string.isRequired,
    selectors: PropTypes.shape({
      getBalance: PropTypes.func.isRequired,
      getTokenBalance: PropTypes.func.isRequired,
    }).isRequired,
  };

  state = {
    inputValue: '',
    outputValue: '',
    inputCurrency: '',
    outputCurrency: '',
    lastEditedField: '',
  };

  getBalance(currency) {
    const { selectors, account } = this.props;

    if (!currency) {
      return '';
    }

    if (currency === 'ETH') {
      const { value, decimals } = selectors().getBalance(account);
      return `Balance: ${value.dividedBy(10 ** decimals).toFixed(4)}`;
    }

    const { value, decimals } = selectors().getTokenBalance(currency, account);
    return `Balance: ${value.dividedBy(10 ** decimals).toFixed(4)}`;
  }

  onInputChange = value => {
    this.setState({
      outputValue: value,
      lastEditedField: INPUT,
    });
  };

  onOutputChange = value => {
    this.setState({
      outputValue: value,
      lastEditedField: OUTPUT,
    });
  };

  render() {
    const {
      isConnected,
    } = this.props;

    const {
      inputValue,
      outputValue,
      inputCurrency,
      outputCurrency,
      lastEditedField,
    } = this.state;

    return (
      <div className={classnames('swap__content', { 'swap--inactive': !isConnected })}>
        <ModeSelector />
        <CurrencyInputPanel
          title="Deposit"
          description={lastEditedField === OUTPUT ? '(estimated)' : ''}
          extraText={this.getBalance(inputCurrency)}
          onCurrencySelected={currency => this.setState({ inputCurrency: currency })}
          onValueChange={this.onInputChange}
        />
        <OversizedPanel>
          <div className="swap__down-arrow-background">
            <img className="swap__down-arrow" src={ArrowDown} />
          </div>
        </OversizedPanel>
        <CurrencyInputPanel
          title="Deposit"
          description={lastEditedField === INPUT ? '(estimated)' : ''}
          extraText={this.getBalance(outputCurrency)}
          onCurrencySelected={currency => this.setState({ outputCurrency: currency })}
          onValueChange={this.onOutputChange}
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
  state => ({
    isConnected: Boolean(state.web3connect.account),
    account: state.web3connect.account,
  }),
  dispatch => ({
    selectors: () => dispatch(Selectors())
  })
)

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}
