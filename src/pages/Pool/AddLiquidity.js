import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from "classnames";
import CurrencyInputPanel from '../../components/CurrencyInputPanel';
import OversizedPanel from '../../components/OversizedPanel';
import ContextualInfo from '../../components/ContextualInfo';
import NavigationTabs from '../../components/NavigationTabs';
import { selectors, addPendingTx } from '../../ducks/web3connect';
import PlusBlue from '../../assets/images/plus-blue.svg';
import PlusGrey from '../../assets/images/plus-grey.svg';
import DropdownBlue from "../../assets/images/dropdown-blue.svg";
import DropupBlue from "../../assets/images/dropup-blue.svg";
import { getBlockDeadline } from '../../helpers/web3-utils';
import { retry } from '../../helpers/promise-utils';
import ModeSelector from './ModeSelector';
import {BigNumber as BN} from 'bignumber.js';
import EXCHANGE_ABI from '../../abi/exchange';
import "./pool.scss";
import ReactGA from "react-ga";

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
    totalSupply: BN(0),
  };

  reset = () => {
    this.setState({
      inputValue: '',
      outputValue: '',
      lastEditedField: '',
    });
  };

  shouldComponentUpdate(nextProps, nextState) {
    const { isConnected, account, exchangeAddresses, balances, web3 } = this.props;
    const { inputValue, outputValue, inputCurrency, outputCurrency, lastEditedField } = this.state;

    return isConnected !== nextProps.isConnected ||
      account !== nextProps.account ||
      exchangeAddresses !== nextProps.exchangeAddresses ||
      web3 !== nextProps.web3 ||
      balances !== nextProps.balances ||
      inputValue !== nextState.inputValue ||
      outputValue !== nextState.outputValue ||
      inputCurrency !== nextState.inputCurrency ||
      outputCurrency !== nextState.outputCurrency ||
      lastEditedField !== nextState.lastEditedField;
  }

  componentWillReceiveProps() {
    this.recalcForm();
  }

  recalcForm = async () => {
    const {
      outputCurrency,
      inputValue,
      outputValue,
      lastEditedField,
      totalSupply: oldTotalSupply,
    } = this.state;
    const { exchangeAddresses: { fromToken }, web3 } = this.props;
    const exchangeAddress = fromToken[outputCurrency];
    const exchangeRate = this.getExchangeRate();
    const append = {};

    if (!outputCurrency || this.isNewExchange() || !web3) {
      return;
    }

    const exchange = new web3.eth.Contract(EXCHANGE_ABI, exchangeAddress);
    const totalSupply = await exchange.methods.totalSupply().call();
    if (!oldTotalSupply.isEqualTo(BN(totalSupply))) {
      append.totalSupply = BN(totalSupply);
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
  };

  getBalance(currency) {
    const { selectors, account } = this.props;

    if (!currency) {
      return '';
    }

    const { value, decimals } = selectors().getBalance(account, currency);
    if (!decimals) {
      return '';
    }

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
    let deadline;
    try {
      deadline = await retry(() => getBlockDeadline(web3, 300));
    } catch(e) {
      // TODO: Handle error.
      return;
    }

    const MAX_LIQUIDITY_SLIPPAGE = 0.025;
    const minLiquidity = this.isNewExchange() ? BN(0) : liquidityMinted.multipliedBy(1 - MAX_LIQUIDITY_SLIPPAGE);
    const maxTokens = this.isNewExchange() ? tokenAmount : tokenAmount.multipliedBy(1 + MAX_LIQUIDITY_SLIPPAGE);

    try {
      exchange.methods.addLiquidity(minLiquidity.toFixed(0), maxTokens.toFixed(0), deadline).send({
        from: account,
        value: ethAmount.toFixed(0)
      }, (err, data) => {
        this.reset();
        this.props.addPendingTx(data);
        if (data) {
          ReactGA.event({
            category: 'Pool',
            action: 'AddLiquidity',
          });
        }
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

    const { value: tokenValue, decimals } = selectors().getBalance(fromToken[token], token);
    const { value: ethValue } = selectors().getBalance(fromToken[token], eth);

    return tokenValue.isZero() && ethValue.isZero() && decimals !== 0;
  }

  getExchangeRate() {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const { inputCurrency, outputCurrency } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];

    if (!eth || !token) {
      return;
    }

    const { value: tokenValue, decimals } = selectors().getBalance(fromToken[token], token);
    const { value: ethValue } = selectors().getBalance(fromToken[token], eth);

    return tokenValue.multipliedBy(10 ** (18 - decimals)).dividedBy(ethValue);
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
        <div className="pool__exchange-rate-wrapper">
          <span className="swap__exchange-rate">Your Pool Share</span>
          <span> - </span>
        </div>
      </div>
    );

    const { selectors, exchangeAddresses: { fromToken }, account } = this.props;
    const { getBalance } = selectors();
    const { inputCurrency, outputCurrency, inputValue, outputValue, totalSupply } = this.state;
    const eth = [inputCurrency, outputCurrency].filter(currency => currency === 'ETH')[0];
    const token = [inputCurrency, outputCurrency].filter(currency => currency !== 'ETH')[0];
    const exchangeAddress = fromToken[token];

    if (!eth || !token || !exchangeAddress) {
      return blank;
    }

    const { value: tokenValue, decimals, label } = getBalance(exchangeAddress, token);
    const { value: ethValue } = getBalance(exchangeAddress);
    const { value: liquidityBalance } = getBalance(account, exchangeAddress);
    const ownership = liquidityBalance.dividedBy(totalSupply);
    const ethPer = ethValue.dividedBy(totalSupply);
    const tokenPer = tokenValue.dividedBy(totalSupply);
    const ownedEth = ethPer.multipliedBy(liquidityBalance).dividedBy(10 ** 18);
    const ownedToken = tokenPer.multipliedBy(liquidityBalance).dividedBy(10 ** decimals);

    if (!label || !decimals) {
      return blank;
    }

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
            <span>{` ${ethValue.dividedBy(10 ** 18).toFixed(2)} ${eth} + ${tokenValue.dividedBy(10 ** decimals).toFixed(2)} ${label}`}</span>
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">
              Your Pool Share ({ownership.multipliedBy(100).toFixed(2)}%)
            </span>
            <span>{`${ownedEth.toFixed(2)} ETH + ${ownedToken.toFixed(2)} ${label}`}</span>
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
          <span>{`1 ETH = ${tokenValue.multipliedBy(10 ** (18 - decimals)).dividedBy(ethValue).toFixed(4)} ${label}`}</span>
        </div>
        <div className="pool__exchange-rate-wrapper">
          <span className="swap__exchange-rate">Current Pool Size</span>
          <span>{` ${ethValue.dividedBy(10 ** 18).toFixed(2)} ${eth} + ${tokenValue.dividedBy(10 ** decimals).toFixed(2)} ${label}`}</span>
        </div>
        <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">
              Your Pool Share ({ownership.multipliedBy(100).toFixed(2)}%)
            </span>
          <span>{`${ownedEth.toFixed(2)} ETH + ${ownedToken.toFixed(2)} ${label}`}</span>
        </div>
      </div>
    )
  }

  renderSummary(inputError, outputError) {
    const { selectors, exchangeAddresses: { fromToken } } = this.props;
    const {
      inputValue,
      outputValue,
      inputCurrency,
      outputCurrency,
    } = this.state;
    const inputIsZero = BN(inputValue).isZero();
    const outputIsZero = BN(outputValue).isZero();

    let contextualInfo = '';
    let isError = false;
    const { label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);
    if (inputError || outputError) {
      contextualInfo = inputError || outputError;
      isError = true;
    } else if (!inputCurrency || !outputCurrency) {
      contextualInfo = 'Select a token to continue.';
    } else if (inputCurrency === outputCurrency) {
      contextualInfo = 'Must be different token.';
    } else if (![inputCurrency, outputCurrency].includes('ETH')) {
      contextualInfo = 'One of the input must be ETH.';
    } else if (inputIsZero || outputIsZero) {
      contextualInfo = 'Amount cannot be zero.';
    } else if (this.isUnapproved()) {
      contextualInfo = 'Please unlock token to continue.';
    } else if (!inputValue || !outputValue) {
      contextualInfo = `Enter a ${inputCurrency} or ${label} value to continue.`;
    }

    return (
      <ContextualInfo
        key="context-info"
        contextualInfo={contextualInfo}
        isError={isError}
        modalClass="pool__summary-modal"
        renderTransactionDetails={this.renderTransactionDetails}
      />
    );
  }

  renderTransactionDetails = () => {
    const { selectors, exchangeAddresses: { fromToken }, account } = this.props;
    const {
      inputValue,
      outputValue,
      outputCurrency,
      totalSupply,
    } = this.state;

    ReactGA.event({
      category: 'TransactionDetail',
      action: 'Open',
    });

    const { value: tokenReserve, decimals, label } = selectors().getTokenBalance(outputCurrency, fromToken[outputCurrency]);
    const { value: ethReserve } = selectors().getBalance(fromToken[outputCurrency]);
    const { decimals: poolTokenDecimals } = selectors().getBalance(account, fromToken[outputCurrency]);

    if (this.isNewExchange()) {
      return (
        <div>
          <div className="pool__summary-modal__item">You are adding {b(`${inputValue} ETH`)} and {b(`${outputValue} ${label}`)} to the liquidity pool.</div>
          <div className="pool__summary-modal__item">You are setting the initial exchange rate to {b(`1 ETH = ${BN(outputValue).dividedBy(inputValue).toFixed(4)} ${label}`)}.</div>
          <div className="pool__summary-modal__item">You will mint {b(`${inputValue} liquidity tokens`)}.</div>
          <div className="pool__summary-modal__item">Current total supply of liquidity tokens is 0.</div>
        </div>
      );
    }

    const SLIPPAGE = 0.025;
    const minOutput = BN(outputValue).multipliedBy(1 - SLIPPAGE);
    const maxOutput = BN(outputValue).multipliedBy(1 + SLIPPAGE);
    const minPercentage = minOutput.dividedBy(minOutput.plus(tokenReserve)).multipliedBy(100);
    const maxPercentage = maxOutput.dividedBy(maxOutput.plus(tokenReserve)).multipliedBy(100);
    const liquidityMinted = BN(inputValue).multipliedBy(totalSupply.dividedBy(ethReserve));
    const adjTotalSupply = totalSupply.dividedBy(10 ** poolTokenDecimals);

    return (
      <div>
        <div className="pool__summary-modal__item">You are adding between {b(`${+BN(inputValue).toFixed(7)} ETH`)} and {b(`${+minOutput.toFixed(7)} - ${+maxOutput.toFixed(7)} ${label}`)} into the liquidity pool.</div>
        <div className="pool__summary-modal__item">You will mint {b(+liquidityMinted.toFixed(7))} liquidity tokens.</div>
        <div className="pool__summary-modal__item">Current total supply of liquidity tokens is {b(+adjTotalSupply.toFixed(7))}</div>
        <div className="pool__summary-modal__item">At current exchange rate, each pool token is worth {b(+ethReserve.dividedBy(totalSupply).toFixed(7))} ETH and {b(+tokenReserve.dividedBy(totalSupply).toFixed(7))} {label}</div>
      </div>
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
                  🚰 You are the first person to add liquidity!
                </div>
                <div className="pool__new-exchange-warning-text">
                  {`The initial exchange rate will be set based on your deposits. Please make sure that your ETH and ${label} deposits have the same fiat value.`}
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
            <img className="swap__down-arrow" src={isValid ? PlusBlue : PlusGrey} />
          </div>
        </OversizedPanel>
        <CurrencyInputPanel
          title="Deposit"
          description={this.isNewExchange() ? '(estimated)' : ''}
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
      this.renderSummary(inputError, outputError)
    ];
  }
}

export default connect(
  state => ({
    isConnected: Boolean(state.web3connect.account) && state.web3connect.networkId == (process.env.REACT_APP_NETWORK_ID||1),
    account: state.web3connect.account,
    balances: state.web3connect.balances,
    web3: state.web3connect.web3,
    exchangeAddresses: state.addresses.exchangeAddresses,
  }),
  dispatch => ({
    selectors: () => dispatch(selectors()),
    addPendingTx: id => dispatch(addPendingTx(id)),
  })
)(AddLiquidity);

function b(text) {
  return <span className="swap__highlight-text">{text}</span>
}
