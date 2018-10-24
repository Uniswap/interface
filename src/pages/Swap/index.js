import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {BigNumber as BN} from "bignumber.js";
import { selectors, sync } from '../../ducks/web3connect';
import Header from '../../components/Header';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import Pending from '../../assets/images/pending.svg';
import {
  swapInput,
  swapOutput,
} from '../../helpers/exchange-utils';

import "./swap.scss";

const INPUT = 0;
const OUTPUT = 1;

class Swap extends Component {
  static propTypes = {
    account: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
    isValid: PropTypes.bool.isRequired,
    selectors: PropTypes.func.isRequired,
  };

  state = {
    inputValue: '',
    outputValue: '',
    inputCurrency: '',
    outputCurrency: '',
    lastEditedField: '',
  };

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  reset() {
    this.setState({
      inputValue: '',
      outputValue: '',
      inputCurrency: '',
      outputCurrency: '',
      lastEditedField: '',
    });
  }

  componentWillReceiveProps() {
    this.recalcForm();
  }

  recalcForm() {
    const { inputCurrency, outputCurrency } = this.state;

    if (!inputCurrency || !outputCurrency) {
      return;
    }

    if (inputCurrency === outputCurrency) {
      return;
    }

    if (inputCurrency !== 'ETH' && outputCurrency !== 'ETH') {
      return;
    }

    this.recalcEthTokenForm();
  }

  recalcEthTokenForm = () => {
    const {
      exchangeAddresses: { fromToken },
      selectors,
      account,
    } = this.props;

    const {
      inputValue: oldInputValue,
      outputValue: oldOutputValue,
      inputCurrency,
      outputCurrency,
      lastEditedField,
      exchangeRate: oldExchangeRate,
    } = this.state;

    if (!inputCurrency || !outputCurrency) {
      return;
    }

    const tokenAddress = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];
    const exchangeAddress = fromToken[tokenAddress];
    if (!exchangeAddress) {
      return;
    }
    const { decimals: inputDecimals } = selectors().getBalance(account, inputCurrency);
    const { decimals: outputDecimals } = selectors().getBalance(account, outputCurrency);
    const { value: inputReserve } = selectors().getBalance(exchangeAddress, inputCurrency);
    const { value: outputReserve }= selectors().getBalance(exchangeAddress, outputCurrency);

    if (lastEditedField === INPUT) {
      if (!oldInputValue) {
        return this.setState({
          outputValue: '',
          exchangeRate: BN(0),
        });
      }

      const inputAmount = BN(oldInputValue).multipliedBy(10 ** inputDecimals);
      const outputAmount = calculateEtherTokenOutput({ inputAmount, inputReserve, outputReserve });
      const exchangeRate = outputAmount.dividedBy(inputAmount);
      const outputValue = outputAmount.dividedBy(BN(10 ** outputDecimals)).toFixed(7);

      const appendState = {};

      if (!exchangeRate.isEqualTo(BN(oldExchangeRate))) {
        appendState.exchangeRate = exchangeRate;
      }

      if (outputValue !== oldOutputValue) {
        appendState.outputValue = outputValue;
      }

      this.setState(appendState);
    }
  };

  updateInput = amount => {
    this.setState({
      inputValue: amount,
      lastEditedField: INPUT,
    }, this.recalcForm);
  };

  updateOutput = amount => {
    this.setState({
      outputValue: amount,
      lastEditedField: OUTPUT,
    }, this.recalcForm);
  };

  onSwap = async () => {
    const {
      input,
      output,
      inputCurrency,
      outputCurrency,
      exchangeAddresses,
      lastEditedField,
      account,
      contracts,
    } = this.props;

    const { drizzle } = this.context;
    let swapTxId;

    if (lastEditedField === INPUT) {
      swapTxId = await swapInput({
        drizzleCtx: drizzle,
        contractStore: contracts,
        input,
        output,
        inputCurrency,
        outputCurrency,
        exchangeAddresses,
        account,
      });
    }

    if (lastEditedField === 'output') {
      swapTxId = await swapOutput({
        drizzleCtx: drizzle,
        contractStore: contracts,
        input,
        output,
        inputCurrency,
        outputCurrency,
        exchangeAddresses,
        account,
      });
    }

    this.resetSwap();
    this.setState({swapTxId});
  };

  renderSummary() {
    const {
      inputValue,
      inputCurrency,
      outputValue,
      outputCurrency,
    } = this.state;

    const { selectors, account } = this.props;
    const { label: inputLabel } = selectors().getBalance(account, inputCurrency);
    const { label: outputLabel } = selectors().getBalance(account, outputCurrency);

    if (!inputCurrency || !outputCurrency) {
      return (
        <div className="swap__summary-wrapper">
          <div>Select a token to continue.</div>
        </div>
      )
    }

    if (!inputValue || !outputValue) {
      return (
        <div className="swap__summary-wrapper">
          <div>Enter a value to continue.</div>
        </div>
      )
    }

    return (
      <div className="swap__summary-wrapper">
        <div>You are selling {b(`${inputValue} ${inputLabel}`)}</div>
        <div>You will receive between {b(outputValue)} and {b(`${outputValue} ${outputLabel}`)}</div>
      </div>
    )
  }

  renderExchangeRate() {
    const { account, selectors } = this.props;
    const { exchangeRate, inputCurrency, outputCurrency } = this.state;
    const { label: inputLabel } = selectors().getBalance(account, inputCurrency);
    const { label: outputLabel } = selectors().getBalance(account, outputCurrency);

    if (!exchangeRate || exchangeRate.isNaN() || !inputCurrency || !outputCurrency) {
      return (
        <OversizedPanel hideBottom>
          <div className="swap__exchange-rate-wrapper">
            <span className="swap__exchange-rate">Exchange Rate</span>
            <span> - </span>
          </div>
        </OversizedPanel>
      );
    }

    return (
      <OversizedPanel hideBottom>
        <div className="swap__exchange-rate-wrapper">
          <span className="swap__exchange-rate">Exchange Rate</span>
          <span>
            {`1 ${inputLabel} = ${exchangeRate.toFixed(7)} ${outputLabel}`}
          </span>
        </div>
      </OversizedPanel>
    );
  }

  render() {
    const { selectors, account } = this.props;
    const {
      lastEditedField,
      inputCurrency,
      outputCurrency,
      inputValue,
      outputValue,
    } = this.state;
    const estimatedText = '(estimated)';

    const { value: inputBalance, decimals: inputDecimals } = selectors().getBalance(account, inputCurrency);
    const { value: outputBalance, decimals: outputDecimals } = selectors().getBalance(account, outputCurrency);

    return (
      <div className="swap">
        <Header />
        <div
          className={classnames('swap__content', {
            'swap--inactive': !this.props.isConnected,
          })}
        >
          <CurrencyInputPanel
            title="Input"
            description={lastEditedField === OUTPUT ? estimatedText : ''}
            extraText={inputCurrency
              ? `Balance: ${inputBalance.dividedBy(BN(10 ** inputDecimals)).toFixed(4)}`
              : ''
            }
            onCurrencySelected={inputCurrency => this.setState({ inputCurrency }, this.recalcForm)}
            onValueChange={this.updateInput}
            selectedTokens={[inputCurrency, outputCurrency]}
            selectedTokenAddress={inputCurrency}
            value={inputValue}
          />
          <OversizedPanel>
            <div className="swap__down-arrow-background">
              <img className="swap__down-arrow" src={ArrowDown} />
            </div>
          </OversizedPanel>
          <CurrencyInputPanel
            title="Output"
            description={lastEditedField === INPUT ? estimatedText : ''}
            extraText={outputCurrency
              ? `Balance: ${outputBalance.dividedBy(BN(10 ** outputDecimals)).toFixed(4)}`
              : ''
            }
            onCurrencySelected={outputCurrency => this.setState({ outputCurrency }, this.recalcForm)}
            onValueChange={this.updateOutput}
            selectedTokens={[inputCurrency, outputCurrency]}
            value={outputValue}
            selectedTokenAddress={outputCurrency}
          />
          { this.renderExchangeRate() }
          { this.renderSummary() }
        </div>
        <button
          className={classnames('swap__cta-btn', {
            'swap--inactive': !this.props.isConnected,
            'swap__cta-btn--inactive': !this.props.isValid,
          })}
          disabled={!this.props.isValid}
          onClick={this.onSwap}
        >
          Swap
        </button>
      </div>
    );
  }
}

export default drizzleConnect(
  Swap,
  state => ({
    balances: state.web3connect.balances,
    isConnected: !!state.web3connect.account,
    account: state.web3connect.account,
    exchangeAddresses: state.addresses.exchangeAddresses,
  }),
  dispatch => ({
    selectors: () => dispatch(selectors()),
  }),
);

const b = text => <span className="swap__highlight-text">{text}</span>;

function calculateEtherTokenOutput({ inputAmount: rawInput, inputReserve: rawReserveIn, outputReserve: rawReserveOut }) {
  const inputAmount = BN(rawInput);
  const inputReserve = BN(rawReserveIn);
  const outputReserve = BN(rawReserveOut);

  if (inputAmount.isLessThan(BN(10 ** 9))) {
    console.warn(`inputAmount is only ${inputAmount.toFixed(0)}. Did you forget to multiply by 10 ** decimals?`);
  }

  const numerator = inputAmount.multipliedBy(outputReserve).multipliedBy(997);
  const denominator = inputReserve.multipliedBy(1000).plus(inputAmount.multipliedBy(997));

  return numerator.dividedBy(denominator);
}
