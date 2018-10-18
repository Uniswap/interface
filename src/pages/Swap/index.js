import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {BigNumber as BN} from "bignumber.js";
import { isValidSwap, updateField, addError, removeError } from '../../ducks/swap';
import Header from '../../components/Header';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import {
  calculateExchangeRateFromInput,
  calculateExchangeRateFromOutput,
  swapInput,
  swapOutput,
} from '../../helpers/exchange-utils';
import promisify from '../../helpers/web3-promisfy';

import "./swap.scss";

class Swap extends Component {
  static propTypes = {
    // Injected by React Router Dom
    push: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    currentAddress: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
    isValid: PropTypes.bool.isRequired,
    updateField: PropTypes.func.isRequired,
    input: PropTypes.string,
    output: PropTypes.string,
    inputCurrency: PropTypes.string,
    outputCurrency: PropTypes.string,
    lastEditedField: PropTypes.string,
    inputErrors: PropTypes.arrayOf(PropTypes.string),
    outputErrors: PropTypes.arrayOf(PropTypes.string),
  };

  static contextTypes = {
    drizzle: PropTypes.object,
  };

  state = {
    exchangeRate: BN(0),
  };

  componentWillReceiveProps(nextProps) {
    this.getExchangeRate(nextProps)
      .then(exchangeRate => {
        this.setState({ exchangeRate });
        if (!exchangeRate) {
          return;
        }

        if (nextProps.lastEditedField === 'input') {
          this.props.updateField('output', `${BN(nextProps.input).multipliedBy(exchangeRate).toFixed(7)}`);
        } else if (nextProps.lastEditedField === 'output') {
          this.props.updateField('input', `${BN(nextProps.output).multipliedBy(BN(1).dividedBy(exchangeRate)).toFixed(7)}`);
        }
      });
  }

  componentWillUnmount() {
    this.props.updateField('output', '');
    this.props.updateField('input', '');
    this.props.updateField('outputCurrency', '');
    this.props.updateField('inputCurrency', '');
    this.props.updateField('lastEditedField', '');
  }

  getTokenLabel(address) {
    if (address === 'ETH') {
      return 'ETH';
    }

    const {
      initialized,
      contracts,
    } = this.props;
    const { drizzle } = this.context;
    const { web3 } = drizzle;

    if (!initialized || !web3 || !address) {
      return '';
    }

    const symbolKey = drizzle.contracts[address].methods.symbol.cacheCall();
    const token = contracts[address];
    const symbol = token.symbol[symbolKey];

    if (!symbol) {
      return '';
    }

    return symbol.value;
  }

  updateInput(amount) {
    this.props.updateField('input', amount);
    if (!amount) {
      this.props.updateField('output', '');
    }
    this.props.updateField('lastEditedField', 'input');
  }

  updateOutput(amount) {
    this.props.updateField('output', amount);
    if (!amount) {
      this.props.updateField('input', '');
    }
    this.props.updateField('lastEditedField', 'output');
  }

  async getExchangeRate(props) {
    const {
      input,
      output,
      inputCurrency,
      outputCurrency,
      exchangeAddresses,
      lastEditedField,
      contracts,
    } = props;

    const { drizzle } = this.context;

    return lastEditedField === 'input'
      ? await calculateExchangeRateFromInput({
        drizzleCtx: drizzle,
        contractStore: contracts,
        input,
        output,
        inputCurrency,
        outputCurrency,
        exchangeAddresses,
      })
      : await calculateExchangeRateFromOutput({
        drizzleCtx: drizzle,
        contractStore: contracts,
        input,
        output,
        inputCurrency,
        outputCurrency,
        exchangeAddresses,
      }) ;
  }

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

    if (lastEditedField === 'input') {
      swapInput({
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
      swapOutput({
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
    // this.context.drizzle.web3.eth.getBlockNumber((_, d) => this.context.drizzle.web3.eth.getBlock(d, (_,d) => {
    //   const deadline = d.timestamp + 300;
    //   const id = exchange.methods.ethToTokenSwapInput.cacheSend(`${output * 10 ** 18}`, deadline, {
    //     from: "0xCf1dE0b4d1e492080336909f70413a5F4E7eEc62",
    //     value: `${input * 10 ** 18}`,
    //   }, );
    // }));
  };

  render() {
    const { lastEditedField, inputCurrency, outputCurrency, input, output, isValid, outputErrors, inputErrors } = this.props;
    const { exchangeRate } = this.state;
    const inputLabel = this.getTokenLabel(inputCurrency);
    const outputLabel = this.getTokenLabel(outputCurrency);
    const estimatedText = '(estimated)';

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
            description={lastEditedField === 'output' ? estimatedText : ''}
            onCurrencySelected={d => this.props.updateField('inputCurrency', d)}
            onValueChange={d => this.updateInput(d)}
            selectedTokens={[inputCurrency, outputCurrency]}
            addError={error => this.props.addError('inputErrors', error)}
            removeError={error => this.props.removeError('inputErrors', error)}
            errors={inputErrors}
            value={input}
          />
          <OversizedPanel>
            <div className="swap__down-arrow-background">
              <img className="swap__down-arrow" src={ArrowDown} />
            </div>
          </OversizedPanel>
          <CurrencyInputPanel
            title="Output"
            description={lastEditedField === 'input' ? estimatedText : ''}
            onCurrencySelected={d => this.props.updateField('outputCurrency', d)}
            onValueChange={d => this.updateOutput(d)}
            selectedTokens={[inputCurrency, outputCurrency]}
            addError={error => this.props.addError('outputErrors', error)}
            removeError={error => this.props.removeError('outputErrors', error)}
            errors={outputErrors}
            value={output}
          />
          <OversizedPanel hideBottom>
            <div className="swap__exchange-rate-wrapper">
              <span className="swap__exchange-rate">Exchange Rate</span>
              <span>
                {exchangeRate ? `1 ${inputLabel} = ${exchangeRate.toFixed(7)} ${outputLabel}` : ' - '}
              </span>
            </div>
          </OversizedPanel>
          {
            inputLabel && input
              ? (
                <div className="swap__summary-wrapper">
                  <div>You are selling <span className="swap__highlight-text">{`${input} ${inputLabel}`}</span></div>
                  <div>You will receive between <span className="swap__highlight-text">12.80</span> and <span
                    className="swap__highlight-text">12.83 BAT</span></div>
                </div>
              )
              : null
          }
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

export default withRouter(
  drizzleConnect(
    Swap,
    (state, ownProps) => ({
      // React Router
      push: ownProps.history.push,
      pathname: ownProps.location.pathname,

      // From Drizzle
      initialized: state.drizzleStatus.initialized,
      balance: state.accountBalances[state.accounts[0]] || null,
      account: state.accounts[0],
      contracts: state.contracts,
      currentAddress: state.accounts[0],
      isConnected: !!(state.drizzleStatus.initialized && state.accounts[0]),

      // Redux Store
      input: state.swap.input,
      output: state.swap.output,
      inputCurrency: state.swap.inputCurrency,
      outputCurrency: state.swap.outputCurrency,
      lastEditedField: state.swap.lastEditedField,
      exchangeAddresses: state.addresses.exchangeAddresses,
      isValid: isValidSwap(state),
      inputErrors: state.swap.inputErrors,
      outputErrors: state.swap.outputErrors,
    }),
    dispatch => ({
      updateField: (name, value) => dispatch(updateField({ name, value })),
      addError: (name, value) => dispatch(addError({ name, value })),
      removeError: (name, value) => dispatch(removeError({ name, value }))
    })
  ),
);
