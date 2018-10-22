import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react'
import PropTypes from 'prop-types';
import { CSSTransitionGroup } from "react-transition-group";
import classnames from 'classnames';
import Fuse from '../../helpers/fuse';
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
    extraText: PropTypes.string,
    value: PropTypes.string,
    onCurrencySelected: PropTypes.func,
    onValueChange: PropTypes.func,
    tokenAddresses: PropTypes.shape({
      address: PropTypes.array.isRequired,
    }).isRequired,
    exchangeAddresses: PropTypes.shape({
      fromToken: PropTypes.object.isRequired,
    }).isRequired,
    selectedTokens: PropTypes.array.isRequired,
    errorMessage: PropTypes.string,
    selectedTokenAddress: PropTypes.string,
  };

  static defaultProps = {
    selectedTokens: [],
    onCurrencySelected() {},
    onValueChange() {},
    selectedTokenAddress: '',
  };

  static contextTypes = {
    drizzle: PropTypes.object,
  };

  state = {
    isShowingModal: false,
    searchQuery: '',
  };

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

  onTokenSelect = (address) => {
    this.setState({
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
        const exchangeConfig = {
          contractName: exchangeAddress,
          web3Contract: new web3.eth.Contract(EXCHANGE_ABI, exchangeAddress),
        };
        const exchangeEvents = ['Approval', 'Transfer', 'TokenPurchase', 'EthPurchase', 'AddLiquidity', 'RemoveLiquidity'];
        this.context.drizzle.addContract(exchangeConfig, exchangeEvents , { from: this.props.account });
      }
    }
  };

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
      extraText,
      errorMessage,
      value,
      onValueChange,
      selectedTokenAddress,
    } = this.props;

    return (
      <div className="currency-input-panel">
        <div className={classnames('currency-input-panel__container', {
          'currency-input-panel__container--error': errorMessage,
        })}>
          <div className="currency-input-panel__label-row">
            <div className="currency-input-panel__label-container">
              <span className="currency-input-panel__label">{title}</span>
              <span className="currency-input-panel__label-description">{description}</span>
            </div>
            <span className={classnames('currency-input-panel__extra-text', {
              'currency-input-panel__extra-text--error': errorMessage,
            })}>
              {extraText}
            </span>
          </div>
          <div className="currency-input-panel__input-row">
            <input
              type="number"
              className={classnames('currency-input-panel__input',{
                'currency-input-panel__input--error': errorMessage,
              })}
              placeholder="0.0"
              onChange={e => onValueChange(e.target.value)}
              value={value}
            />
            {/*<button*/}
              {/*className='currency-input-panel__sub-currency-select'*/}
            {/*>*/}
              {/*Unlock*/}
            {/*</button>*/}
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
              { TOKEN_ADDRESS_TO_LABEL[selectedTokenAddress] || 'Select a token' }
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
  state => ({
    exchangeAddresses: state.addresses.exchangeAddresses,
    tokenAddresses: state.addresses.tokenAddresses,
    contracts: state.contracts,
  }),
);
