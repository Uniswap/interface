import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { isValidSend, updateField, addError, removeError, resetSend } from '../../ducks/send';
import { selectors, sync } from '../../ducks/web3connect';
import {BigNumber as BN} from "bignumber.js";
import deepEqual from 'deep-equal';

import Header from '../../components/Header';
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import AddressInputPanel from '../../components/AddressInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import ArrowDown from '../../assets/images/arrow-down-blue.svg';
import Pending from '../../assets/images/pending.svg';

import {
  calculateExchangeRateFromInput,
  calculateExchangeRateFromOutput,
  sendInput,
  sendOutput,
} from '../../helpers/exchange-utils';
import {
  isExchangeUnapproved,
  approveExchange,
} from '../../helpers/approval-utils';
import {
  getTxStatus
} from '../../helpers/contract-utils';

import "./send.scss";

class Send extends Component {
  static propTypes = {
    // Injected by React Router Dom
    push: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    currentAddress: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
    updateField: PropTypes.func.isRequired,
    input: PropTypes.string,
    output: PropTypes.string,
    inputCurrency: PropTypes.string,
    outputCurrency: PropTypes.string,
    recipient: PropTypes.string,
    lastEditedField: PropTypes.string,
  };

  static contextTypes = {
    drizzle: PropTypes.object,
  };

  state = {
    exchangeRate: BN(0),
    approvalTxId: null,
    sendTxId: null,
  };

  shouldComponentUpdate(nextProps, nextState) {
    return !deepEqual(nextProps, this.props) ||
      !deepEqual(nextState, this.state);
  }

  componentDidUpdate() {
    if (this.getSendStatus() === 'pending') {
      this.resetSend();
    }

    this.getExchangeRate(this.props)
      .then(exchangeRate => {
        if (this.state.exchangeRate !== exchangeRate) {
          this.setState({ exchangeRate });
        }

        if (!exchangeRate) {
          return;
        }

        if (this.props.lastEditedField === 'input') {
          this.props.updateField('output', `${BN(this.props.input).multipliedBy(exchangeRate).toFixed(7)}`);
        } else if (this.props.lastEditedField === 'output') {
          this.props.updateField('input', `${BN(this.props.output).multipliedBy(BN(1).dividedBy(exchangeRate)).toFixed(7)}`);
        }
      });
  }

  componentWillUnmount() {
    this.resetSend();
  }

  resetSend() {
    this.props.resetSend();
    this.setState({approvalTxId: null, sendTxId: null});
  }

  getSendStatus() {
    const { drizzle } = this.context;

    return getTxStatus({
      drizzleCtx: drizzle,
      txId: this.state.sendTxId,
    });
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

  getIsUnapproved() {
    const {
      input,
      inputCurrency,
      account,
      contracts,
      exchangeAddresses
    } = this.props;
    const { drizzle } = this.context;

    return isExchangeUnapproved({
      value: input,
      currency: inputCurrency,
      drizzleCtx: drizzle,
      contractStore: contracts,
      account,
      exchangeAddresses,
    });
  }

  approveExchange = async () => {
    const {
      inputCurrency,
      exchangeAddresses,
      account,
      contracts,
    } = this.props;
    const { drizzle } = this.context;

    if (this.getIsUnapproved()) {
      const approvalTxId = await approveExchange({
        currency: inputCurrency,
        drizzleCtx: drizzle,
        contractStore: contracts,
        account,
        exchangeAddresses,
      });

      this.setState({ approvalTxId })
    }
  }

  getApprovalStatus() {
    const { drizzle } = this.context;

    return getTxStatus({
      drizzleCtx: drizzle,
      txId: this.state.approvalTxId,
    });
  }

  onSend = async () => {
    const {
      input,
      output,
      inputCurrency,
      outputCurrency,
      recipient,
      exchangeAddresses,
      lastEditedField,
      account,
      contracts,
      selectors,
    } = this.props;

    const { drizzle } = this.context;
    const { decimals: inputDecimals } = inputCurrency === 'ETH' ?
      selectors().getBalance(account)
      : selectors().getTokenBalance(inputCurrency, account);
    const { decimals: outputDecimals } = outputCurrency === 'ETH' ?
      selectors().getBalance(account)
      : selectors().getTokenBalance(outputCurrency, account);
    let sendTxId;

    if (lastEditedField === 'input') {
      sendTxId = await sendInput({
        drizzleCtx: drizzle,
        contractStore: contracts,
        input,
        output,
        inputCurrency,
        outputCurrency,
        recipient,
        exchangeAddresses,
        account,
        inputDecimals,
        outputDecimals,
      });
    }

    if (lastEditedField === 'output') {
      sendTxId = await sendOutput({
        drizzleCtx: drizzle,
        contractStore: contracts,
        input,
        output,
        inputCurrency,
        outputCurrency,
        recipient,
        exchangeAddresses,
        account,
        inputDecimals,
        outputDecimals,
      });
    }

    this.setState({ sendTxId });
  };

  handleSubButtonClick = () => {
    if (this.getIsUnapproved() && this.getApprovalStatus() !== 'pending') {
      this.approveExchange();
    }
  }

  validate() {
    const {
      selectors,
      account,
      input,
      output,
      inputCurrency,
      outputCurrency
    } = this.props;

    let inputError;
    let isValid = true;

    if (!input || !output || !inputCurrency || !outputCurrency) {
      isValid = false;
    }

    const { value: inputBalance, decimals: inputDecimals } = inputCurrency === 'ETH' ?
      selectors().getBalance(account)
      : selectors().getTokenBalance(inputCurrency, account);

    if (inputBalance.isLessThan(BN(input * 10 ** inputDecimals))) {
      inputError = 'Insufficient Balance';
    }

    return {
      inputError,
      outputError: '',
      isValid: isValid && !inputError,
    };
  }

  renderSummary(inputError, outputError, inputLabel, outputLabel) {
    const {
      selectors,
      input,
      output,
      inputCurrency,
      outputCurrency,
      recipient,
    } = this.props;
    const { exchangeRate } = this.state;

    let nextStepMessage;
    if (inputError || outputError) {
      nextStepMessage = inputError || outputError;
    } else if (!inputCurrency || !outputCurrency) {
      nextStepMessage = 'Select a token to continue.';
    } else if (inputCurrency === outputCurrency) {
      nextStepMessage = 'Must be different token.';
    } else if (!input || !output) {
      const missingCurrencyValue = !input ? inputCurrency : outputCurrency;
      nextStepMessage = `Enter a ${missingCurrencyValue} value to continue.`;
    } else if (!recipient) {
      nextStepMessage = 'Enter a wallet address to send to.';
    }

    if (nextStepMessage) {
      return (
        <div className="swap__summary-wrapper">
          <div>{nextStepMessage}</div>
        </div>
      )
    }

    const SLIPPAGE = 0.025;
    const exchangedOutput = BN(input).multipliedBy(BN(exchangeRate));
    const minOutput = exchangedOutput.multipliedBy(1 - SLIPPAGE).toFixed(8);
    const maxOutput = exchangedOutput.multipliedBy(1 + SLIPPAGE).toFixed(8);

    return (
      <div className="swap__summary-wrapper">
        <div>
          You are selling {b(`${input} ${inputLabel}`)}
        </div>
        <div className="send__last-summary-text">
          <span className="swap__highlight-text">{recipient.slice(0, 6)}</span>
          will receive between {b(`${minOutput} ${outputLabel}`)} and {b(`${maxOutput} ${outputLabel}`)}
        </div>
      </div>
    )
  }

  render() {
    const { lastEditedField, inputCurrency, outputCurrency, input, output, recipient } = this.props;
    const { exchangeRate } = this.state;
    const inputLabel = this.getTokenLabel(inputCurrency);
    const outputLabel = this.getTokenLabel(outputCurrency);
    const estimatedText = '(estimated)';

    const { inputError, outputError, isValid } = this.validate();

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
            description={lastEditedField === 'output' ? estimatedText : ''}
            onCurrencySelected={(d) => {
              this.props.updateField('inputCurrency', d)
              this.props.sync();
            }}
            onValueChange={d => this.updateInput(d)}
            selectedTokens={[inputCurrency, outputCurrency]}
            errorMessage={inputError}
            value={input}
            selectedTokenAddress={inputCurrency}
            extraText={this.getBalance(inputCurrency)}
          />
          <OversizedPanel>
            <div className="swap__down-arrow-background">
              <img className="swap__down-arrow" src={ArrowDown} />
            </div>
          </OversizedPanel>
          <CurrencyInputPanel
            title="Output"
            description={lastEditedField === 'input' ? estimatedText : ''}
            onCurrencySelected={(d) => {
              this.props.updateField('outputCurrency', d)
              this.props.sync();
            }}
            onValueChange={d => this.updateOutput(d)}
            selectedTokens={[inputCurrency, outputCurrency]}
            errorMessage={outputError}
            value={output}
            selectedTokenAddress={outputCurrency}
            extraText={this.getBalance(outputCurrency)}
          />
          <OversizedPanel>
            <div className="swap__down-arrow-background">
              <img className="swap__down-arrow" src={ArrowDown} />
            </div>
          </OversizedPanel>
          <AddressInputPanel
            value={recipient}
            onChange={address => this.props.updateField('recipient', address)}
          />
          <OversizedPanel hideBottom>
            <div className="swap__exchange-rate-wrapper">
              <span className="swap__exchange-rate">Exchange Rate</span>
              <span>
                {exchangeRate ? `1 ${inputLabel} = ${exchangeRate.toFixed(7)} ${outputLabel}` : ' - '}
              </span>
            </div>
          </OversizedPanel>
          { this.renderSummary(inputError, outputError, inputLabel, outputLabel) }
        </div>
        <button
          className={classnames('swap__cta-btn', {
            'swap--inactive': !this.props.isConnected,
            'swap__cta-btn--inactive': !isValid,
          })}
          disabled={!isValid}
          onClick={this.onSend}
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
      balances: state.web3connect.balances,
      input: state.send.input,
      output: state.send.output,
      inputCurrency: state.send.inputCurrency,
      outputCurrency: state.send.outputCurrency,
      recipient: state.send.recipient,
      lastEditedField: state.send.lastEditedField,
      exchangeAddresses: state.addresses.exchangeAddresses,
    }),
    dispatch => ({
      updateField: (name, value) => dispatch(updateField({ name, value })),
      addError: (name, value) => dispatch(addError({ name, value })),
      removeError: (name, value) => dispatch(removeError({ name, value })),
      resetSend: () => dispatch(resetSend()),
      selectors: () => dispatch(selectors()),
      sync: () => dispatch(sync()),
    })
  ),
);

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}
