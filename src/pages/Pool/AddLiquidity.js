import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';
import classnames from "classnames";
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import { selectors, sync } from '../../ducks/web3connect';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import ModeSelector from './ModeSelector';
import {BigNumber as BN} from 'bignumber.js';
import "./pool.scss";

const INPUT = 0;
const OUTPUT = 1;

class AddLiquidity extends Component {
  static propTypes = {
    isConnected: PropTypes.bool.isRequired,
    account: PropTypes.string.isRequired,
    selectors: PropTypes.func.isRequired,
    exchangeAddresses: PropTypes.shape({
      fromToken: PropTypes.object.isRequired,
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
    const { inputCurrency, outputCurrency } = this.state;
    const exchangeRate = this.getExchangeRate();
    let outputValue;

    if (inputCurrency === 'ETH' && outputCurrency && outputCurrency !== 'ETH') {
      outputValue = exchangeRate.multipliedBy(value).toFixed(7);
    }

    if (outputCurrency === 'ETH' && inputCurrency && inputCurrency !== 'ETH') {
      outputValue = BN(value).dividedBy(exchangeRate).toFixed(7);
    }

    this.setState({
      outputValue,
      inputValue: value,
      lastEditedField: INPUT,
    });
  };

  onOutputChange = value => {
    const { inputCurrency, outputCurrency } = this.state;
    const exchangeRate = this.getExchangeRate();
    let inputValue;

    if (inputCurrency === 'ETH' && outputCurrency && outputCurrency !== 'ETH') {
      inputValue = BN(value).dividedBy(exchangeRate).toFixed(7);
    }

    if (outputCurrency === 'ETH' && inputCurrency && inputCurrency !== 'ETH') {
      inputValue = exchangeRate.multipliedBy(value).toFixed(7);
    }

    this.setState({
      inputValue,
      outputValue: value,
      lastEditedField: OUTPUT,
    });
  };

  getExchangeRate() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return;
    }

    const { value: tokenValue } = selectors().getTokenBalance(token, fromToken[token]);
    const { value: ethValue } = selectors().getBalance(fromToken[token]);

    return tokenValue.dividedBy(ethValue);
  }

  renderInfo() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return (
        <div className="pool__summary-panel">
          <div className="pool__exchange-rate-wrapper">
            <span className="pool__exchange-rate">Exchange Rate</span>
            <span> - </span>
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">Current Pool Size</span>
            <span> - </span>
          </div>
        </div>
      )
    }

    const {
      value: tokenValue,
      decimals,
      label
    } = selectors().getTokenBalance(token, fromToken[token]);

    const { value: ethValue } = selectors().getBalance(fromToken[token]);

    return (
      <div className="pool__summary-panel">
        <div className="pool__exchange-rate-wrapper">
          <span className="pool__exchange-rate">Exchange Rate</span>
          <span>{`1 ETH = ${tokenValue.dividedBy(ethValue).toFixed(4)} BAT`}</span>
        </div>
        <div className="pool__exchange-rate-wrapper">
          <span className="swap__exchange-rate">Current Pool Size</span>
          <span>{` ${ethValue.dividedBy(10 ** 18).toFixed(2)} ${eth} / ${tokenValue.dividedBy(10 ** decimals).toFixed(2)} ${label}`}</span>
        </div>
      </div>
    )
  }

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
          onCurrencySelected={currency => {
            this.setState({ inputCurrency: currency });
            this.props.sync();
          }}
          onValueChange={this.onInputChange}
          value={inputValue}
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
          onCurrencySelected={currency => {
            this.setState({ outputCurrency: currency });
            this.props.sync();
          }}
          onValueChange={this.onOutputChange}
          value={outputValue}
        />
        <OversizedPanel hideBottom>
        { this.renderInfo() }
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
    balances: state.web3connect.balances,
    exchangeAddresses: state.addresses.exchangeAddresses,
  }),
  dispatch => ({
    selectors: () => dispatch(selectors()),
    sync: () => dispatch(sync()),
  })
)

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}
