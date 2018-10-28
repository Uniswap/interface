import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { CSSTransitionGroup } from "react-transition-group";
import classnames from 'classnames';
import { withRouter } from 'react-router-dom';
import Fuse from '../../helpers/fuse';
import Modal from '../Modal';
import TokenLogo from '../TokenLogo';
import SearchIcon from '../../assets/images/magnifying-glass.svg';
import { selectors } from "../../ducks/web3connect";
import { addExchange } from "../../ducks/addresses";
import { BigNumber as BN } from 'bignumber.js';

import './currency-panel.scss';

import ERC20_ABI from '../../abi/erc20';
import FACTORY_ABI from '../../abi/factory';

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
      addresses: PropTypes.array.isRequired,
    }).isRequired,
    exchangeAddresses: PropTypes.shape({
      fromToken: PropTypes.object.isRequired,
    }).isRequired,
    factoryAddress: PropTypes.string,
    selectedTokens: PropTypes.array.isRequired,
    errorMessage: PropTypes.string,
    account: PropTypes.string,
    selectedTokenAddress: PropTypes.string,
    disableTokenSelect: PropTypes.bool,
    selectors: PropTypes.func.isRequired,
    addExchange: PropTypes.func.isRequired,
    filteredTokens: PropTypes.arrayOf(PropTypes.string),
    disableUnlock: PropTypes.bool,
    renderInput: PropTypes.func,
  };

  static defaultProps = {
    selectedTokens: [],
    filteredTokens: [],
    onCurrencySelected() {},
    onValueChange() {},
    selectedTokenAddress: '',
  };

  state = {
    isShowingModal: false,
    searchQuery: '',
  };

  createTokenList = () => {
    const { filteredTokens } = this.props;
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

    return tokenList.filter(({ address }) => !filteredTokens.includes(address));
  };

  onTokenSelect = (address) => {
    this.setState({
      searchQuery: '',
      isShowingModal: false,
    });

    this.props.onCurrencySelected(address);
  };

  renderTokenList() {
    const tokens = this.createTokenList();
    const { searchQuery } = this.state;
    const {
      selectedTokens,
      disableTokenSelect,
      web3,
      selectors,
      account,
      factoryAddress,
      exchangeAddresses: { fromToken },
      addExchange,
      history,
    } = this.props;

    if (web3 && web3.utils && web3.utils.isAddress(searchQuery)) {
      const tokenAddress = searchQuery;
      const { label } = selectors().getBalance(account, tokenAddress);
      const factory = new web3.eth.Contract(FACTORY_ABI, factoryAddress);
      const exchangeAddress = fromToken[tokenAddress];

      if (!exchangeAddress) {
        factory.methods.getExchange(tokenAddress).call((err, data) => {
          if (!err && data !== '0x0000000000000000000000000000000000000000') {
            addExchange({ label, tokenAddress, exchangeAddress: data });
          }
        });
      }
    }

    if (disableTokenSelect) {
      return;
    }

    let results;

    if (!searchQuery) {
      results = tokens;
    } else {
      const fuse = new Fuse(tokens, FUSE_OPTIONS);
      results = fuse.search(this.state.searchQuery);
    }

    if (!results.length && web3.utils.isAddress(searchQuery)) {
      const { label } = selectors().getBalance(account, searchQuery);
      return [
        <div key="token-modal-no-exchange" className="token-modal__token-row token-modal__token-row--no-exchange">
          <div>No Exchange Found</div>
        </div>,
        <div
          key="token-modal-create-exchange"
          className="token-modal__token-row token-modal__token-row--create-exchange"
          onClick={() => {
            this.setState({ isShowingModal: false });
            history.push(`/create-exchange/${searchQuery}`);
          }}
        >
          <div>{`Create exchange fro ${label}`}</div>
        </div>
      ]
    }

    if (!results.length) {
      return (
        <div className="token-modal__token-row token-modal__token-row--no-exchange">
          <div>No Exchange Found</div>
        </div>
      )
    }

    return results.map(({ label, address }) => {
      const isSelected = selectedTokens.indexOf(address) > -1;

      return (
        <div
          key={label}
          className={
            classnames('token-modal__token-row', {
              'token-modal__token-row--selected': isSelected,
            })
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
      <Modal onClose={() => this.setState({ isShowingModal: false, searchQuery: '' })}>
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

  renderUnlockButton() {
    const {
      selectors,
      selectedTokenAddress,
      account,
      exchangeAddresses: { fromToken },
      web3,
      disableUnlock,
      value,
    } = this.props;

    if (disableUnlock || !selectedTokenAddress || selectedTokenAddress === 'ETH') {
      return;
    }

    const { value: allowance, decimals, label } = selectors().getApprovals(selectedTokenAddress, account, fromToken[selectedTokenAddress]);

    if (
      !label ||
      (
        allowance.isGreaterThanOrEqualTo(BN((value || 0) * 10 ** decimals)) &&
        !BN(allowance).isZero()
      )
    )  {
      return;
    }

    return (
      <button
        className='currency-input-panel__sub-currency-select'
        onClick={() => {
          const contract = new web3.eth.Contract(ERC20_ABI, selectedTokenAddress);
          const amount = BN(10 ** decimals).multipliedBy(10 ** 8).toFixed(0);
          contract.methods.approve(fromToken[selectedTokenAddress], amount)
            .send({ from: account }, (err, data) => {
              if (data) {
                // TODO: Handle Pending in Redux
              }
            });
        }}
      >
        Unlock
      </button>
    );
  }

  renderInput() {
    const {
      errorMessage,
      value,
      onValueChange,
      selectedTokenAddress,
      disableTokenSelect,
      renderInput,
    } = this.props;

    if (typeof renderInput === 'function') {
      return renderInput();
    }

    return (
      <div className="currency-input-panel__input-row">
        <input
          type="number"
          min="0"
          className={classnames('currency-input-panel__input',{
            'currency-input-panel__input--error': errorMessage,
          })}
          placeholder="0.0"
          onChange={e => onValueChange(e.target.value)}
          onKeyPress={e => {
            const charCode = e.which ? e.which : e.keyCode;

            // Prevent 'minus' character
            if (charCode === 45) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          value={value}
        />
        { this.renderUnlockButton() }
        <button
          className={classnames("currency-input-panel__currency-select", {
            'currency-input-panel__currency-select--selected': selectedTokenAddress,
            'currency-input-panel__currency-select--disabled': disableTokenSelect,
          })}
          onClick={() => {
            if (!disableTokenSelect) {
              this.setState({ isShowingModal: true });
            }
          }}
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
    );
  }

  render() {
    const {
      title,
      description,
      extraText,
      errorMessage,
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
          {this.renderInput()}
        </div>
        {this.renderModal()}
      </div>
    )
  }
}

export default withRouter(
  connect(
    state => ({
      factoryAddress: state.addresses.factoryAddress,
      exchangeAddresses: state.addresses.exchangeAddresses,
      tokenAddresses: state.addresses.tokenAddresses,
      contracts: state.contracts,
      account: state.web3connect.account,
      approvals: state.web3connect.approvals,
      web3: state.web3connect.web3,
    }),
    dispatch => ({
      selectors: () => dispatch(selectors()),
      addExchange: opts => dispatch(addExchange(opts)),
    }),
  )(CurrencyInputPanel)
);
