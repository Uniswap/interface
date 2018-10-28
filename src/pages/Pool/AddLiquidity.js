import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from "classnames";
import { CSSTransitionGroup } from "react-transition-group";
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import NavigationTabs from '../../components/NavigationTabs';
import Modal from '../../components/Modal';
import { selectors } from '../../ducks/web3connect';
import ArrowDown from '../../assets/images/plus-blue.svg';
import DropdownBlue from "../../assets/images/dropdown-blue.svg";
import DropupBlue from "../../assets/images/dropup-blue.svg";
import ModeSelector from './ModeSelector';
import {BigNumber as BN} from 'bignumber.js';
import EXCHANGE_ABI from '../../abi/exchange';
import "./pool.scss";
import promisify from "../../helpers/web3-promisfy";

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
    inputCurrency: 'ETH',
    outputCurrency: '',
    lastEditedField: '',
    showSummaryModal: false,
  };

  shouldComponentUpdate(nextProps, nextState) {
    const { isConnected, account, exchangeAddresses, balances, web3 } = this.props;
    const { inputValue, outputValue, inputCurrency, outputCurrency, lastEditedField, showSummaryModal } = this.state;

    return isConnected !== nextProps.isConnected ||
      account !== nextProps.account ||
      exchangeAddresses !== nextProps.exchangeAddresses ||
      web3 !== nextProps.web3 ||
      balances !== nextProps.balances ||
      inputValue !== nextState.inputValue ||
      outputValue !== nextState.outputValue ||
      inputCurrency !== nextState.inputCurrency ||
      outputCurrency !== nextState.outputCurrency ||
      lastEditedField !== nextState.lastEditedField ||
      showSummaryModal !== nextState.showSummaryModal;
  }

  componentWillReceiveProps() {
    this.recalcForm();
  }

  recalcForm = () => {
    const {
      outputCurrency,
      inputValue,
      outputValue,
      lastEditedField,
    } = this.state;
    const exchangeRate = this.getExchangeRate();
    const append = {};

    if (!outputCurrency || this.isNewExchange()) {
      return;
    }

    if (lastEditedField === INPUT) {
      const newOutputValue = exchangeRate.multipliedBy(inputValue).toFixed(7);
      if (newOutputValue !== outputValue) {
        append.outputValue = newOutputValue;
      }
    }

    if (lastEditedField === OUTPUT) {
      const newInputValue = BN(outputValue).dividedBy(exchangeRate).toFixed(7);
      if (newInputValue !== inputValue) {
        append.inputValue = newInputValue;
      }
    }

    this.setState(append);
  }

  getBalance(currency) {
    const { selectors, account } = this.props;

    if (!currency) {
      return '';
    }

    const { value, decimals } = selectors().getBalance(account, currency);
    return `Balance: ${value.dividedBy(10 ** decimals).toFixed(4)}`;
  }

  isUnapproved() {
    const { account, exchangeAddresses, selectors } = this.props;
    const { outputCurrency, outputValue } = this.state;

    if (!outputCurrency) {
      return false;
    }

    const { value: allowance, label, decimals } = selectors().getApprovals(
      outputCurrency,
      account,
      exchangeAddresses.fromToken[outputCurrency]
    );

    if (label && allowance.isLessThan(BN(outputValue * 10 ** decimals || 0))) {
      return true;
    }

    return false;
  }

  onAddLiquidity = async () => {
    const { account, web3, exchangeAddresses: { fromToken }, selectors } = this.props;
    const { inputValue, outputValue, outputCurrency } = this.state;
    const exchange = new web3.eth.Contract(EXCHANGE_ABI, fromToken[outputCurrency]);

    const ethAmount = BN(inputValue).multipliedBy(10 ** 18);
    const { decimals } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);
    const tokenAmount = BN(outputValue).multipliedBy(10 ** decimals);
    const { value: ethReserve } = selectors().getBalance(fromToken[outputCurrency]);
    const totalLiquidity = await exchange.methods.totalSupply().call();
    const liquidityMinted = BN(totalLiquidity).multipliedBy(ethAmount.dividedBy(ethReserve));
    const blockNumber = await promisify(web3, 'getBlockNumber');
    const block = await promisify(web3, 'getBlock', blockNumber);
    const deadline = block.timestamp + 300;
    const MAX_LIQUIDITY_SLIPPAGE = 0.025;
    const minLiquidity = this.isNewExchange() ? BN(0) : liquidityMinted.multipliedBy(1 - MAX_LIQUIDITY_SLIPPAGE);
    const maxTokens = tokenAmount.multipliedBy(1 + MAX_LIQUIDITY_SLIPPAGE);

    try {
      await exchange.methods.addLiquidity(minLiquidity.toFixed(0), maxTokens.toFixed(0), deadline).send({
        from: account,
        value: ethAmount.toFixed(0)
      });
    } catch (err) {
      console.error(err);
    }
  };

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

    const append = {
      inputValue: value,
      lastEditedField: INPUT,
    };

    if (!this.isNewExchange()) {
      append.outputValue = outputValue;
    }

    this.setState(append);
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

    const append = {
      outputValue: value,
      lastEditedField: INPUT,
    };

    if (!this.isNewExchange()) {
      append.inputValue = inputValue;
    }

    this.setState(append);
  };

  isNewExchange() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return false;
    }

    const { value: tokenValue } = selectors().getBalance(fromToken[token], token);
    const { value: ethValue } = selectors().getBalance(fromToken[token], eth);

    return tokenValue.isZero() && ethValue.isZero();
  }

  getExchangeRate() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return;
    }

    const { value: tokenValue } = selectors().getBalance(fromToken[token], token);
    const { value: ethValue } = selectors().getBalance(fromToken[token], eth);

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
    const inputIsZero = BN(inputValue).isZero();
    const outputIsZero = BN(outputValue).isZero();

    if (!inputValue || inputIsZero || !outputValue || outputIsZero || !inputCurrency || !outputCurrency || this.isUnapproved()) {
      isValid = false;
    }

    const { value: ethValue } = selectors().getBalance(account, inputCurrency);
    const { value: tokenValue, decimals } = selectors().getBalance(account, outputCurrency);

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
    const blank = (
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
    );

    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { getBalance } = selectors();
    const { inputCurrency, outputCurrency, inputValue, outputValue } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return blank;
    }

    const { value: tokenValue, decimals, label } = getBalance(fromToken[token], token);
    const { value: ethValue } = getBalance(fromToken[token]);

    if (this.isNewExchange()) {
      const rate = BN(outputValue).dividedBy(inputValue);
      const rateText = rate.isNaN() ? '---' : rate.toFixed(4);
      return (
        <div className="pool__summary-panel">
          <div className="pool__exchange-rate-wrapper">
            <span className="pool__exchange-rate">Exchange Rate</span>
            <span>{`1 ETH = ${rateText} ${label}`}</span>
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">Current Pool Size</span>
            <span>{` ${ethValue.dividedBy(10 ** 18).toFixed(2)} ${eth} / ${tokenValue.dividedBy(10 ** decimals).toFixed(2)} ${label}`}</span>
          </div>
        </div>
      )
    }

    if (tokenValue.dividedBy(ethValue).isNaN()) {
      return blank;
    }

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
    const inputIsZero = BN(inputValue).isZero();
    const outputIsZero = BN(outputValue).isZero();

    if (!inputCurrency || !outputCurrency) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Select a token to continue.</div>
        </div>
      )
    }

    if (inputCurrency === outputCurrency) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Must be different token.</div>
        </div>
      )
    }

    if (![inputCurrency, outputCurrency].includes('ETH')) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>One of the input must be ETH.</div>
        </div>
      )
    }

    if (inputIsZero || outputIsZero) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Amount cannot be zero.</div>
        </div>
      )
    }

    if (this.isUnapproved()) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>Please unlock token to continue.</div>
        </div>
      )
    }

    const { label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);

    if (!inputValue || !outputValue) {
      return (
        <div key="summary" className="swap__summary-wrapper">
          <div>{`Enter a ${inputCurrency} or ${label} value to continue.`}</div>
        </div>
      )
    }

    return [
      <div
        key="open-details"
        className="swap__summary-wrapper swap__open-details-container"
        onClick={() => this.setState({showSummaryModal: true})}
      >
        <span>Transaction Details</span>
        <img src={DropdownBlue} />
      </div>,
      this.renderSummaryModal()
    ];
  }

  renderSummaryModal() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const {
      inputValue,
      outputValue,
      outputCurrency,
      showSummaryModal,
    } = this.state;
    if (!showSummaryModal) {
      return null;
    }

    const { value, decimals, label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);

    const SLIPPAGE = 0.025;
    const minOutput = BN(outputValue).multipliedBy(1 - SLIPPAGE);
    const maxOutput = BN(outputValue).multipliedBy(1 + SLIPPAGE);
    const tokenReserve = value.dividedBy(10 ** decimals);
    const minPercentage = minOutput.dividedBy(minOutput.plus(tokenReserve)).multipliedBy(100);
    const maxPercentage = maxOutput.dividedBy(maxOutput.plus(tokenReserve)).multipliedBy(100);

    return (
      <Modal key="modal" onClose={() => this.setState({ showSummaryModal: false })}>
        <CSSTransitionGroup
          transitionName="summary-modal"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className="swap__summary-modal">
            <div
              key="open-details"
              className="swap__open-details-container"
              onClick={() => this.setState({showSummaryModal: false})}
            >
              <span>Transaction Details</span>
              <img src={DropupBlue} />
            </div>
            <div>
              <div>You are adding between {b(`${minOutput.toFixed(5)} - ${maxOutput.toFixed(5)} ${label}`)} + {b(`${BN(inputValue).toFixed(5)} ETH`)} into the liquidity pool.</div>
              <div className="pool__last-summary-text">
                You will receive between {b(`${minPercentage.toFixed(5)}%`)} and {b(`${maxPercentage.toFixed(5)}%`)} of the {`${label}/ETH`} pool tokens.
              </div>
            </div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    );
  }

  render() {
    const {
      isConnected,
      exchangeAddresses: { fromToken },
      selectors,
    } = this.props;

    const {
      inputValue,
      outputValue,
      inputCurrency,
      outputCurrency,
    } = this.state;

    const { inputError, outputError, isValid } = this.validate();
    const { label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);

    return [
      <div
        key="content"
        className={classnames('swap__content', {
          'swap--inactive': !isConnected,
        })}
      >
        <NavigationTabs
          className={classnames('header__navigation', {
            'header--inactive': !isConnected,
          })}
        />
        {
          this.isNewExchange()
            ? (
              <div className="pool__new-exchange-warning">
                <div className="pool__new-exchange-warning-text">
                  You are the first person to add liquidity🚰!
                </div>
                <div className="pool__new-exchange-warning-text">
                  {`A new exchange rate will be set based on your deposits. Please make sure that your ETH and ${label} deposits have the same fiat value.`}
                </div>
              </div>
            )
            : null
        }
        <ModeSelector title="Add Liquidity" />
        <CurrencyInputPanel
          title="Deposit"
          extraText={this.getBalance(inputCurrency)}
          onValueChange={this.onInputChange}
          selectedTokenAddress="ETH"
          value={inputValue}
          errorMessage={inputError}
          disableTokenSelect
        />
        <OversizedPanel>
          <div className="swap__down-arrow-background">
            <img className="swap__down-arrow" src={ArrowDown} />
          </div>
        </OversizedPanel>
        <CurrencyInputPanel
          title="Deposit"
          description="(estimated)"
          extraText={this.getBalance(outputCurrency)}
          selectedTokenAddress={outputCurrency}
          onCurrencySelected={currency => {
            this.setState({
              outputCurrency: currency,
            }, this.recalcForm);
          }}
          onValueChange={this.onOutputChange}
          value={outputValue}
          errorMessage={outputError}
          filteredTokens={[ 'ETH' ]}
        />
        <OversizedPanel hideBottom>
          { this.renderInfo() }
        </OversizedPanel>
        <div className="pool__cta-container">
          <button
            className={classnames('pool__cta-btn', {
              'swap--inactive': !this.props.isConnected,
              'pool__cta-btn--inactive': !isValid,
            })}
            disabled={!isValid}
            onClick={this.onAddLiquidity}
          >
            Add Liquidity
          </button>
        </div>
      </div>,
      this.renderSummary()
    ];
  }
}

export default connect(
  state => ({
    isConnected: Boolean(state.web3connect.account) && state.web3connect.networkId == process.env.REACT_APP_NETWORK_ID,
    account: state.web3connect.account,
    balances: state.web3connect.balances,
    web3: state.web3connect.web3,
    exchangeAddresses: state.addresses.exchangeAddresses,
  }),
  dispatch => ({
    selectors: () => dispatch(selectors()),
  })
)(AddLiquidity);

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}
