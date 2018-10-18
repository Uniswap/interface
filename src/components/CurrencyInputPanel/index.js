import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react'
import PropTypes from 'prop-types';
import { CSSTransitionGroup } from "react-transition-group";
import classnames from 'classnames';
import {BigNumber as BN} from 'bignumber.js';
import Fuse from '../../helpers/fuse';
import { updateField } from '../../ducks/swap';
import { INSUFFICIENT_BALANCE } from '../../constants/currencyInputErrorTypes';
import Modal from '../Modal';
import TokenLogo from '../TokenLogo';
import SearchIcon from '../../assets/images/magnifying-glass.svg';
import ERC20_ABI from '../../abi/erc20';

import './currency-panel.scss';
import EXCHANGE_ABI from "../../abi/exchange";

const FUSE_OPTIONS = {
  includeMatches: false,
  threshold: 0.0,
  tokenize:true,
  location: 0,
  distance: 100,
  maxPatternLength: 45,
  minMatchCharLength: 1,
  keys: [
    {name:"address",weight:0.8},
    {name:"label",weight:0.5},
  ]
};

const TOKEN_ADDRESS_TO_LABEL = { ETH: 'ETH' };

class CurrencyInputPanel extends Component {
  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    value: PropTypes.string,
    initialized: PropTypes.bool,
    onCurrencySelected: PropTypes.func,
    onValueChange: PropTypes.func,
    exchangeAddresses: PropTypes.shape({
      fromToken: PropTypes.object.isRequired,
    }).isRequired,
    errors: PropTypes.arrayOf(PropTypes.string),
    addError: PropTypes.func,
    removeError: PropTypes.func,
  };

  static defaultProps = {
    onCurrencySelected() {},
    onValueChange() {},
    addError() {},
    removeError() {},
    errors: [],
  };

  static contextTypes = {
    drizzle: PropTypes.object,
  };

  state = {
    isShowingModal: false,
    searchQuery: '',
    selectedTokenAddress: '',
  };

  getTokenData(address) {
    const {
      initialized,
      contracts,
      account,
    } = this.props;
    const { drizzle } = this.context;
    const { web3 } = drizzle;

    if (!initialized || !web3) {
      return;
    }

    const balanceKey = drizzle.contracts[address].methods.balanceOf.cacheCall(account);
    const decimalsKey = drizzle.contracts[address].methods.decimals.cacheCall();
    const token = contracts[address];

    const balance = token.balanceOf[balanceKey];
    const decimals = token.decimals[decimalsKey];

    if (!balance || !decimals) {
      return;
    }


    return {
      balance: balance.value,
      decimals: decimals.value,
    };
  }

  getBalance() {
    const {
      balance,
      initialized,
    } = this.props;
    const { selectedTokenAddress } = this.state;
    const { drizzle } = this.context;
    const { web3 } = drizzle;

    if (!selectedTokenAddress || !initialized || !web3 || !balance) {
      return null;
    }

    if (selectedTokenAddress === 'ETH') {
      return BN(web3.utils.fromWei(balance, 'ether')).toFixed(2);
    }

    const tokenData = this.getTokenData(selectedTokenAddress);

    if (!tokenData) {
      return null;
    }

    const tokenBalance = BN(tokenData.balance);
    const denomination = Math.pow(10, tokenData.decimals);
    const adjustedBalance = tokenBalance.dividedBy(denomination);

    return adjustedBalance.toFixed(2);
  }

  createTokenList = () => {
    let tokens = this.props.tokenAddresses.addresses;
    let tokenList = [ { value: 'ETH', label: 'ETH', address: 'ETH' } ];

    for (let i = 0; i < tokens.length; i++) {
      let entry = { value: '', label: '' };
      entry.value = tokens[i][0];
      entry.label = tokens[i][0];
      entry.address = tokens[i][1];
      tokenList.push(entry);
      TOKEN_ADDRESS_TO_LABEL[tokens[i][1]] = tokens[i][0];
    }

    return tokenList;
  };

  validate = (balance) => {
    const { value, addError, removeError, errors } = this.props;
    const hasInsufficientBalance = errors.indexOf(INSUFFICIENT_BALANCE) > -1;
    const balanceIsLess = BN(value).isGreaterThan(BN(balance));

    if (balanceIsLess && !hasInsufficientBalance) {
      addError(INSUFFICIENT_BALANCE);
    } else if (!balanceIsLess && hasInsufficientBalance) {
      removeError(INSUFFICIENT_BALANCE);
    }
  };

  onTokenSelect = (address) => {
    this.setState({
      selectedTokenAddress: address || 'ETH',
      searchQuery: '',
      isShowingModal: false,
    });

    this.props.onCurrencySelected(address);

    if (address && address !== 'ETH') {
      const { drizzle } = this.context;
      const { fromToken } = this.props.exchangeAddresses;
      const { web3 } = drizzle;

      // Add Token Contract
      if (!this.props.contracts[address]) {
        // console.log(`Adding Token Contract - ${address}`);
        const tokenConfig = {
          contractName: address,
          web3Contract: new web3.eth.Contract(ERC20_ABI, address),
        };
        const tokenEvents = ['Approval', 'Transfer'];
        this.context.drizzle.addContract(tokenConfig, tokenEvents, { from: this.props.account });
      }

      // Add Exchange Contract
      const exchangeAddress = fromToken[address];
      if (!exchangeAddress) {
        return;
      }

      if (!this.props.contracts[exchangeAddress]) {
        // console.log(`Adding Exchange Contract - ${exchangeAddress}`);
        const exchangeConfig = {
          contractName: exchangeAddress,
          web3Contract: new web3.eth.Contract(EXCHANGE_ABI, exchangeAddress),
        };
        const exchangeEvents = ['Approval', 'Transfer', 'TokenPurchase', 'EthPurchase', 'AddLiquidity', 'RemoveLiquidity'];
        this.context.drizzle.addContract(exchangeConfig, exchangeEvents , { from: this.props.account });
      }
    }
  };

  renderBalance(balance) {
    if (balance === null) {
      return null;
    }

    return `Balance: ${balance}`;
  }

  renderTokenList() {
    const tokens = this.createTokenList();
    const { searchQuery } = this.state;
    const { selectedTokens } = this.props;
    let results;

    if (!searchQuery) {
      results = tokens;
    } else {
      const fuse = new Fuse(tokens, FUSE_OPTIONS);
      results = fuse.search(this.state.searchQuery);

    }

    return results.map(({ label, address }) => {
      const isSelected = selectedTokens.indexOf(address) > -1;

      return (
        <div
          key={label}
          className={
            classnames('token-modal__token-row', { 'token-modal__token-row--selected': isSelected })
          }
          onClick={() => this.onTokenSelect(address)}
        >
          <TokenLogo className="token-modal__token-logo" address={address} />
          <div className="token-modal__token-label" >{label}</div>
        </div>
      );
    });
  }

  renderModal() {
    if (!this.state.isShowingModal) {
      return null;
    }

    return (
      <Modal onClose={() => this.setState({ isShowingModal: false })}>
        <CSSTransitionGroup
          transitionName="token-modal"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className="token-modal">
            <div className="token-modal__search-container">
              <input
                type="text"
                placeholder="Search Token or Paste Address"
                className="token-modal__search-input"
                onChange={e => {
                  this.setState({ searchQuery: e.target.value });
                }}
              />
              <img src={SearchIcon} className="token-modal__search-icon" />
            </div>
            <div className="token-modal__token-list">
              {this.renderTokenList()}
            </div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    );
  }

  render() {
    const {
      title,
      description,
      value,
      errors
    } = this.props;

    const { selectedTokenAddress } = this.state;
    const balance = this.getBalance();
    this.validate(balance);
    const hasInsufficientBalance = errors.indexOf(INSUFFICIENT_BALANCE) > -1;

    return (
      <div className="currency-input-panel">
        <div className={
          classnames('currency-input-panel__container',
            { 'currency-input-panel__container--error': hasInsufficientBalance }
          )
        }>
          <div className="currency-input-panel__label-row">
            <div className="currency-input-panel__label-container">
              <span className="currency-input-panel__label">{title}</span>
              <span className="currency-input-panel__label-description">{description}</span>
            </div>
            <span className={
              classnames('currency-input-panel__extra-text',
                { 'currency-input-panel__extra-text--error': hasInsufficientBalance }
              )
            }>
              {this.renderBalance(balance)}
            </span>
          </div>
          <div className="currency-input-panel__input-row">
            <input
              type="number"
              className={
                classnames('currency-input-panel__input',
                  { 'currency-input-panel__input--error': hasInsufficientBalance }
                )
              }
              placeholder="0.0"
              onChange={e => this.props.onValueChange(e.target.value)}
              value={this.props.value}
            />
            <button
              className={classnames("currency-input-panel__currency-select", {
                'currency-input-panel__currency-select--selected': selectedTokenAddress,
              })}
              onClick={() => this.setState({ isShowingModal: true })}
            >
              {
                selectedTokenAddress
                  ? (
                    <TokenLogo
                      className="currency-input-panel__selected-token-logo"
                      address={selectedTokenAddress}
                    />
                  )
                  : null
              }
              { TOKEN_ADDRESS_TO_LABEL[selectedTokenAddress]|| 'Select a token' }
              <span className="currency-input-panel__dropdown-icon" />
            </button>
          </div>
        </div>
        {this.renderModal()}
      </div>
    )
  }
}

export default drizzleConnect(
  CurrencyInputPanel,
  state => {
    const {
      drizzleStatus: { initialized },
      accounts,
      accountBalances,
    } = state;

    return {
      tokenAddresses: state.addresses.tokenAddresses,
      exchangeAddresses: state.addresses.exchangeAddresses,
      initialized,
      balance: accountBalances[accounts[0]] || null,
      account: accounts[0],
      contracts: state.contracts,
    };
  },
  dispatch => ({
    updateField: (name, value) => dispatch(updateField({ name, value })),
  }),
);
