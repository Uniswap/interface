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
    balances: PropTypes.object.isRequired,
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

  shouldComponentUpdate(nextProps, nextState) {
    const { isConnected, account, exchangeAddresses, balances } = this.props;
    const { inputValue, outputValue, inputCurrency, outputCurrency, lastEditedField } = this.state;

    return isConnected !== nextProps.isConnected ||
      account !== nextProps.account ||
      exchangeAddresses !== nextProps.exchangeAddresses ||
      balances !== nextProps.balances ||
      inputValue !== nextState.inputValue ||
      outputValue !== nextState.outputValue ||
      inputCurrency !== nextState.inputCurrency ||
      outputCurrency !== nextState.outputCurrency ||
      lastEditedField !== nextState.lastEditedField;
  }

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

  validate() {
    const { selectors, account } = this.props;
    const {
      inputValue, outputValue,
      inputCurrency, outputCurrency,
    } = this.state;

    let inputError;
    let outputError;
    let isValid = true;

    if (!inputValue || !outputValue || !inputCurrency || !outputCurrency) {
      isValid = false;
    }

    const { value: ethValue } = selectors().getBalance(account);
    const { value: tokenValue, decimals } = selectors().getTokenBalance(outputCurrency, account);

    if (ethValue.isLessThan(BN(inputValue * 10 ** 18))) {
      inputError = 'Insufficient Balance';
    }

    if (tokenValue.isLessThan(BN(outputValue * 10 ** decimals))) {
      outputError = 'Insufficient Balance';
    }

    return {
      inputError,
      outputError,
      isValid: isValid && !inputError && !outputError,
    };
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
          <span>{`1 ETH = ${tokenValue.dividedBy(ethValue).toFixed(4)} ${label}`}</span>
        </div>
        <div className="pool__exchange-rate-wrapper">
          <span className="swap__exchange-rate">Current Pool Size</span>
          <span>{` ${ethValue.dividedBy(10 ** 18).toFixed(2)} ${eth} + ${tokenValue.dividedBy(10 ** decimals).toFixed(2)} ${label}`}</span>
        </div>
      </div>
    )
  }

  renderSummary() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const {
      inputValue,
      outputValue,
      inputCurrency,
      outputCurrency,
    } = this.state;

    if (!inputCurrency || !outputCurrency) {
      return (
        <div className="swap__summary-wrapper">
          <div>Select a token to continue.</div>
        </div>
      )
    }

    if (inputCurrency === outputCurrency) {
      return (
        <div className="swap__summary-wrapper">
          <div>Must be different token.</div>
        </div>
      )
    }

    if (![inputCurrency, outputCurrency].includes('ETH')) {
      return (
        <div className="swap__summary-wrapper">
          <div>One of the input must be ETH.</div>
        </div>
      )
    }

    if (!inputValue || !outputValue) {
      return (
        <div className="swap__summary-wrapper">
          <div>{`Enter a ${inputCurrency} or ${outputCurrency} value to continue.`}</div>
        </div>
      )
    }

    const SLIPPAGE = 0.025;
    const minOutput = BN(outputValue).multipliedBy(1 - SLIPPAGE);
    const maxOutput = BN(outputValue).multipliedBy(1 + SLIPPAGE);
    const { value, decimals, label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);
    const tokenReserve = value.dividedBy(10 ** decimals);
    const minPercentage = minOutput.dividedBy(minOutput.plus(tokenReserve)).multipliedBy(100);
    const maxPercentage = maxOutput.dividedBy(maxOutput.plus(tokenReserve)).multipliedBy(100);

    return (
      <div className="swap__summary-wrapper">
        <div>You are adding between {b(`${minOutput.toFixed(2)} - ${maxOutput.toFixed(2)} ${label}`)} + {b(`${inputValue} ETH`)} into the liquidity pool.</div>
        <div className="pool__last-summary-text">
          You will receive between {b(`${minPercentage.toFixed(2)}%`)} and {b(`${maxPercentage.toFixed(2)}%`)} of the {`${label}/ETH`} pool tokens.
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

    const { inputError, outputError, isValid } = this.validate();

    return (
      <div
        className={classnames('swap__content', {
          'swap--inactive': !isConnected,
        })}
      >
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
          selectedTokenAddress={inputCurrency}
          value={inputValue}
          errorMessage={inputError}
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
          selectedTokenAddress={outputCurrency}
          onCurrencySelected={currency => {
            this.setState({ outputCurrency: currency });
            this.props.sync();
          }}
          onValueChange={this.onOutputChange}
          value={outputValue}
          errorMessage={outputError}
        />
        <OversizedPanel hideBottom>
          { this.renderInfo() }
        </OversizedPanel>
        { this.renderSummary() }
        <div className="pool__cta-container">
          <button
            className={classnames('pool__cta-btn', {
              'swap--inactive': !this.props.isConnected,
              'pool__cta-btn--inactive': !isValid,
            })}
            disabled={!isValid}
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
